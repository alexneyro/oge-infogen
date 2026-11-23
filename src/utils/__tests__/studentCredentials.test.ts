import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateStudentCredentials } from '../studentCredentials';
import { MIN_PASSWORD_LENGTH } from '../../lib/passwordPolicy';

describe('generateStudentCredentials', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('имя из одной буквы «И» даёт пароль длиной не меньше MIN_PASSWORD_LENGTH и вида «I» + цифры', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);

    const { password } = generateStudentCredentials('И', 'Ким');

    expect(password.length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH);
    expect(password).toBe('I32502');
    expect(password).toMatch(/^I\d+$/);
  });

  it('имя «Иван» даёт «Ivan» + 4 цифры длиной 8 без добавленных цифр', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const { password } = generateStudentCredentials('Иван', 'Ким');

    expect(password).toBe('Ivan5500');
    expect(password).toHaveLength(8);
  });

  it('фамилия «Ким» даёт логин «kim» + 4 цифры', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1234);

    const { login } = generateStudentCredentials('Иван', 'Ким');

    expect(login).toBe('kim2110');
    expect(login).toMatch(/^kim\d{4}$/);
  });

  it('пустое после очистки имя из одних цифр даёт «Student» + 4 цифры', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const { password } = generateStudentCredentials('12345', 'Ким');

    expect(password).toBe('Student1000');
    expect(password).toMatch(/^Student\d{4}$/);
  });

  it('пустая латинская часть фамилии даёт логин, начинающийся с «student»', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);

    const { login } = generateStudentCredentials('Иван', '12345');

    expect(login).toBe('student9999');
    expect(login).toMatch(/^student\d{4}$/);
  });
});
