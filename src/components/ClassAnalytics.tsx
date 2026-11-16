import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OGE_TASKS, getTaskById } from '../tasks';
import { decodeVariant, buildVariant } from '../variant';
import { ClassMemberWithProfile } from '../hooks/useClasses';

interface Props {
  classId: string;
  members: ClassMemberWithProfile[];
}

export const ClassAnalytics: React.FC<Props> = ({ classId, members }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // matrix: student_id -> { [taskPosition: number]: { correct: number; total: number } }
  const [matrix, setMatrix] = useState<Map<string, Record<number, { correct: number; total: number }>>>(
    new Map()
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadAnalytics() {
      if (!members || members.length === 0) {
        setMatrix(new Map());
        setLoading(false);
        return;
      }

      setLoading(true);
      const studentIds = members.map((m) => m.student_id);

      try {
        const { data: sessions, error } = await (supabase as any)
          .from('sessions')
          .select('user_id, answers, mode, variant_seed, task_type')
          .in('user_id', studentIds);

        if (error) {
          console.error('Error fetching sessions for class analytics:', error);
          if (!isCancelled) setLoading(false);
          return;
        }

        const newMatrix = new Map<string, Record<number, { correct: number; total: number }>>();

        // Инициализируем для каждого ученика пустые записи 1..16
        for (const m of members) {
          const rec: Record<number, { correct: number; total: number }> = {};
          for (let p = 1; p <= 16; p++) {
            rec[p] = { correct: 0, total: 0 };
          }
          newMatrix.set(m.student_id, rec);
        }

        if (sessions && sessions.length > 0) {
          for (const session of sessions) {
            const studentId = session.user_id;
            const studentStats = newMatrix.get(studentId);
            if (!studentStats) continue;

            if (session.mode === 'variant' && session.variant_seed && session.answers) {
              const config = decodeVariant(session.variant_seed);
              if (!config) continue;

              let tasks;
              try {
                tasks = buildVariant(config);
              } catch (e) {
                console.warn('Failed to build variant from seed:', e);
                continue;
              }

              for (const [posStr, answer] of Object.entries(session.answers)) {
                const pos = parseInt(posStr, 10);
                if (pos < 1 || pos > 16) continue;

                const taskInstance = tasks[pos - 1];
                if (!taskInstance) continue;

                const taskMod = getTaskById(taskInstance.taskId) || OGE_TASKS[taskInstance.taskId - 1];
                if (!taskMod) continue;

                const isCorrect = taskMod.check(taskInstance.taskData, String(answer ?? ''));
                if (!studentStats[pos]) {
                  studentStats[pos] = { correct: 0, total: 0 };
                }
                studentStats[pos].total += 1;
                if (isCorrect) {
                  studentStats[pos].correct += 1;
                }
              }
            }
          }
        }

        if (!isCancelled) {
          setMatrix(newMatrix);
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error in class analytics:', err);
        if (!isCancelled) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [classId, members]);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
      {/* Header and Legend */}
      <div className="p-4 border-b border-theme-border space-y-3">
        <div>
          <h4 className="text-base font-bold text-theme-text">Матрица ошибок</h4>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Варианты, позиции 1–16
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-theme-text-sec">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 shrink-0" />
            <span>≥ 70%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500/90 shrink-0" />
            <span>40–69%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/90 shrink-0" />
            <span>&lt; 40%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-theme-border/40 shrink-0" />
            <span>нет данных</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-theme-text-muted">
          Загрузка аналитики...
        </div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center text-xs text-theme-text-muted">
          В классе нет учеников
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-theme-bg border-b border-theme-border">
                <th className="py-3 px-4 text-left text-xs font-semibold text-theme-text-muted uppercase tracking-wide whitespace-nowrap">
                  Ученик
                </th>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((pos) => (
                  <th
                    key={pos}
                    className="py-3 px-2 text-center text-xs font-semibold text-theme-text-muted"
                  >
                    №{pos}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const lastName = member.profiles?.last_name?.trim() || '';
                const firstName = member.profiles?.first_name?.trim() || '';
                const firstInitial = firstName ? `${firstName[0]}.` : '';
                const displayName =
                  lastName || firstName
                    ? `${lastName} ${firstInitial}`.trim()
                    : member.profiles?.email || 'Ученик';

                const studentStats = matrix.get(member.student_id);

                return (
                  <tr
                    key={member.student_id}
                    className="border-b border-theme-border/50 hover:bg-theme-bg/40 transition-colors"
                  >
                    <td
                      onClick={() =>
                        navigate(`/teacher/classes/${classId}/students/${member.student_id}`)
                      }
                      className="py-3 px-4 text-sm font-medium text-theme-text whitespace-nowrap cursor-pointer hover:text-indigo-400 transition-colors"
                      title={displayName}
                    >
                      {displayName}
                    </td>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((pos) => {
                      const stat = studentStats?.[pos] || { correct: 0, total: 0 };
                      const pct = stat.total > 0 ? stat.correct / stat.total : -1;

                      let bgClass = 'bg-theme-border/40 text-theme-text-muted';
                      if (pct >= 0.7) {
                        bgClass = 'bg-emerald-500/90 text-white';
                      } else if (pct >= 0.4) {
                        bgClass = 'bg-yellow-500/90 text-gray-900';
                      } else if (pct >= 0) {
                        bgClass = 'bg-red-500/90 text-white';
                      }

                      const title = `№${pos}: ${stat.correct} из ${stat.total} правильно`;

                      return (
                        <td key={pos} className="py-2 px-2 text-center">
                          <div
                            title={title}
                            className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-[11px] font-bold shadow-xs cursor-default ${bgClass}`}
                          >
                            {stat.total > 0 ? stat.correct : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
