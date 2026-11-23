import { ClassWithMembers } from '../hooks/useClasses';

const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а',
  b: 'в',
  c: 'с',
  e: 'е',
  h: 'н',
  k: 'к',
  m: 'м',
  o: 'о',
  p: 'р',
  t: 'т',
  x: 'х',
};

/**
 * Нормализация ФИО: trim, lower-case, ё -> е, убрать знаки и лишние пробелы.
 */
export function normalizeName(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Нормализация названия класса: lower-case, убрать пробелы,
 * заменить латинские аналоги букв (a,b,c,e,h,k,m,o,p,t,x) на кириллические.
 */
export function normalizeClass(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[abcehkmoptx]/g, (ch) => LATIN_TO_CYRILLIC[ch] ?? ch);
}

export interface StudentMatch {
  classId: string;
  studentId: string;
}

/**
 * Ищет совпадения ученика в классах учителя по ФИО и (опционально) классу из блокнота.
 * Сравнивает «Фамилия Имя» с учётом обоих порядков слов.
 * Если класс в блокноте указан, сначала сужает поиск по нему.
 */
export function findStudentMatches(
  parsedStudent: string,
  parsedGrade: string,
  classes: ClassWithMembers[]
): StudentMatch[] {
  const normStudent = normalizeName(parsedStudent);
  if (!normStudent) return [];

  const normGrade = normalizeClass(parsedGrade);
  let candidateClasses = classes;
  if (normGrade) {
    candidateClasses = classes.filter((cls) => normalizeClass(cls.name) === normGrade);
    if (candidateClasses.length === 0) {
      return [];
    }
  }

  const matches: StudentMatch[] = [];

  for (const cls of candidateClasses) {
    for (const member of cls.members) {
      if (!member.profiles) continue;
      const last = normalizeName(member.profiles.last_name || '');
      const first = normalizeName(member.profiles.first_name || '');
      if (!last && !first) continue;

      let isMatch = false;
      if (last && first) {
        const lastFirst = `${last} ${first}`;
        const firstLast = `${first} ${last}`;
        isMatch = normStudent === lastFirst || normStudent === firstLast;
      } else {
        const single = last || first;
        isMatch = normStudent === single;
      }

      if (isMatch) {
        matches.push({
          classId: cls.id,
          studentId: member.student_id,
        });
      }
    }
  }

  return matches;
}
