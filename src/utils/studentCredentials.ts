import { MIN_PASSWORD_LENGTH } from '../lib/passwordPolicy';

export const transliterate = (str: string): string => {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  };
  return str.toLowerCase().split('').map((c) => map[c] ?? c).join('');
};

export const generateStudentCredentials = (
  firstName: string,
  lastName: string
): { login: string; password: string } => {
  const digits4 = () => String(Math.floor(1000 + Math.random() * 9000));
  const lastNameLat = transliterate(lastName.trim()).replace(/[^a-z]/g, '');
  const firstNameLat = transliterate(firstName.trim()).replace(/[^a-z]/g, '');
  const login = (lastNameLat || 'student') + digits4();
  let password =
    (firstNameLat ? firstNameLat.charAt(0).toUpperCase() + firstNameLat.slice(1) : 'Student') +
    digits4();

  while (password.length < MIN_PASSWORD_LENGTH) {
    password += String(Math.floor(Math.random() * 10));
  }

  return { login, password };
};
