/**
 * Utility for printing documents and variants in pure light mode
 * while correctly restoring dark theme and UI state after printing completes.
 */
export function printDocument(): void {
  if (typeof window === 'undefined') return;

  const docEl = document.documentElement;
  const wasDark = docEl.classList.contains('dark');

  // Temporarily strip 'dark' class so print styles render clean black-on-white
  if (wasDark) {
    docEl.classList.remove('dark');
  }

  let restored = false;
  const restoreTheme = () => {
    if (restored) return;
    restored = true;
    if (wasDark) {
      docEl.classList.add('dark');
    }
    window.removeEventListener('afterprint', restoreTheme);
    window.removeEventListener('focus', onFocus);
  };

  const onFocus = () => {
    // Secondary fallback in case afterprint doesn't trigger
    setTimeout(restoreTheme, 500);
  };

  window.addEventListener('afterprint', restoreTheme, { once: true });
  window.addEventListener('focus', onFocus, { once: true });

  // Timeout failsafe to guarantee theme recovery even in atypical browsers
  setTimeout(() => {
    restoreTheme();
  }, 60000);

  // Invoke browser print dialog
  window.print();
}
