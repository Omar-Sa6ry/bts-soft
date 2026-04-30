import { SQL_INJECTION_REGEX } from './SQL_INJECTION_REGEX';

describe('SQL_INJECTION_REGEX', () => {
  it('should return false for common SQL injection patterns', () => {
    const malicious = [
      'SELECT * FROM users',
      'DROP TABLE accounts',
      'UNION ALL SELECT',
      'INSERT INTO',
      'UPDATE users SET'
    ];

    malicious.forEach(input => {
      expect(SQL_INJECTION_REGEX.test(input)).toBe(false);
    });
  });

  it('should return true for safe text', () => {
    const safe = [
      'Hello World',
      'This is a description',
      'User123',
      'cairo_egypt'
    ];

    safe.forEach(input => {
      SQL_INJECTION_REGEX.lastIndex = 0;
      expect(SQL_INJECTION_REGEX.test(input)).toBe(true);
    });
  });
});
