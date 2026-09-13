export interface PyTestItem {
  input: string;
}

export interface PyTestResult {
  output: string;
  error: string | null;
  timedOut: boolean;
}

const PYODIDE_CDN_JS = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

const WORKER_SCRIPT = `
let pyodide = null;
let pyodideLoadingPromise = null;

async function initPyodide() {
  if (pyodide) return pyodide;
  if (!pyodideLoadingPromise) {
    pyodideLoadingPromise = (async () => {
      importScripts('${PYODIDE_CDN_JS}');
      pyodide = await loadPyodide({ indexURL: '${PYODIDE_INDEX_URL}' });
      await pyodide.runPythonAsync(\`
import json
import io
import contextlib
import traceback
import builtins

def _run_single_test(code_str, input_str):
    lines = str(input_str).splitlines()
    line_idx = 0

    def mock_input(prompt=''):
        nonlocal line_idx
        if line_idx < len(lines):
            val = lines[line_idx]
            line_idx += 1
            return val
        raise EOFError("EOF when reading a line")

    output_buffer = io.StringIO()
    old_input = builtins.input
    builtins.input = mock_input
    
    error_msg = None
    exec_globals = {}
    try:
        with contextlib.redirect_stdout(output_buffer):
            exec(code_str, exec_globals)
    except Exception as e:
        tb_lines = traceback.format_exception_only(type(e), e)
        error_msg = tb_lines[-1].strip() if tb_lines else str(e)
    finally:
        builtins.input = old_input

    out = output_buffer.getvalue()
    return json.dumps({'output': out, 'error': error_msg})
\`);
      return pyodide;
    })();
  }
  return pyodideLoadingPromise;
}

self.onmessage = async (e) => {
  const { id, type, code, inputStr } = e.data;
  if (type === 'init') {
    try {
      await initPyodide();
      self.postMessage({ id, type: 'init_done', success: true });
    } catch (err) {
      self.postMessage({ id, type: 'init_done', success: false, error: String(err) });
    }
  } else if (type === 'run') {
    try {
      const py = await initPyodide();
      const runFn = py.globals.get('_run_single_test');
      const jsonRes = runFn(code, inputStr);
      const parsed = JSON.parse(jsonRes);
      self.postMessage({ id, type: 'run_done', success: true, output: parsed.output, error: parsed.error });
    } catch (err) {
      self.postMessage({ id, type: 'run_done', success: false, error: String(err) });
    }
  }
};
`;

let currentWorker: Worker | null = null;
let isWorkerReady = false;
let globalPyodideAvailable: boolean | null = null;
let pyodidePreloadPromise: Promise<boolean> | null = null;

function getWorker(): Worker {
  if (!currentWorker) {
    if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
      throw new Error('Worker environment not supported');
    }
    const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
    currentWorker = new Worker(URL.createObjectURL(blob));
    isWorkerReady = false;
  }
  return currentWorker;
}

export function killWorker() {
  if (currentWorker) {
    try {
      currentWorker.terminate();
    } catch {
      // ignore
    }
    currentWorker = null;
    isWorkerReady = false;
  }
}

export function isPyodideAvailable(): boolean | null {
  return globalPyodideAvailable;
}

export async function preloadPyodide(
  onStatusChange?: (msg: string) => void,
  timeoutMs: number = 45000
): Promise<boolean> {
  if (isWorkerReady) return true;
  if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    globalPyodideAvailable = false;
    return false;
  }

  if (pyodidePreloadPromise) {
    return pyodidePreloadPromise;
  }

  onStatusChange?.('Загрузка интерпретатора Python...');

  pyodidePreloadPromise = (async () => {
    try {
      const worker = getWorker();
      return await new Promise<boolean>((resolve) => {
        const msgId = Math.random();
        let isSettled = false;

        const timeout = setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            killWorker();
            globalPyodideAvailable = false;
            resolve(false);
          }
        }, timeoutMs);

        const handleMsg = (e: MessageEvent) => {
          if (e.data && e.data.id === msgId && e.data.type === 'init_done') {
            if (!isSettled) {
              isSettled = true;
              clearTimeout(timeout);
              worker.removeEventListener('message', handleMsg);
              if (e.data.success) {
                isWorkerReady = true;
                globalPyodideAvailable = true;
                resolve(true);
              } else {
                killWorker();
                globalPyodideAvailable = false;
                resolve(false);
              }
            }
          }
        };

        worker.addEventListener('message', handleMsg);
        worker.postMessage({ id: msgId, type: 'init' });
      });
    } catch {
      killWorker();
      globalPyodideAvailable = false;
      return false;
    } finally {
      pyodidePreloadPromise = null;
    }
  })();

  return pyodidePreloadPromise;
}

export async function runPythonTests(
  code: string,
  tests: PyTestItem[],
  onProgress?: (currentTestIndex: number, totalTests: number, statusMsg: string) => void,
  onTestComplete?: (testIndex: number, result: PyTestResult) => void,
  getIsCancelled?: () => boolean,
  timeoutMs: number = 5000
): Promise<PyTestResult[]> {
  const isReady = await preloadPyodide((msg) => onProgress?.(0, tests.length, msg));
  if (!isReady) {
    throw new Error('Pyodide unavailable');
  }

  const results: PyTestResult[] = [];

  for (let i = 0; i < tests.length; i++) {
    if (getIsCancelled?.()) {
      break;
    }
    onProgress?.(i + 1, tests.length, `Выполняется тест ${i + 1} из ${tests.length}`);

    await preloadPyodide();
    if (getIsCancelled?.()) break;

    const worker = getWorker();

    const testRes = await new Promise<PyTestResult>((resolve) => {
      const msgId = Math.random();

      const timer = setTimeout(() => {
        killWorker();
        resolve({
          output: '',
          error: `Превышено время выполнения (${Math.round(timeoutMs / 1000)} секунд) — возможно, в программе бесконечный цикл`,
          timedOut: true
        });
      }, timeoutMs);

      const handleMsg = (e: MessageEvent) => {
        if (e.data && e.data.id === msgId && e.data.type === 'run_done') {
          clearTimeout(timer);
          worker.removeEventListener('message', handleMsg);
          if (e.data.success) {
            resolve({
              output: e.data.output || '',
              error: e.data.error || null,
              timedOut: false
            });
          } else {
            resolve({
              output: '',
              error: e.data.error || 'Ошибка исполнения',
              timedOut: false
            });
          }
        }
      };

      worker.addEventListener('message', handleMsg);
      worker.postMessage({ id: msgId, type: 'run', code, inputStr: tests[i].input });
    });

    if (getIsCancelled?.()) break;

    results.push(testRes);
    onTestComplete?.(i, testRes);
  }

  return results;
}
