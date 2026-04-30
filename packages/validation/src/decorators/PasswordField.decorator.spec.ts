import { validate } from 'class-validator';
import { PasswordField, PasswordComplexity } from './PasswordField.decorator';
import 'reflect-metadata';

class TestAlphanumeric {
  @PasswordField(8, 16, PasswordComplexity.ALPHANUMERIC)
  pass: string;
}

class TestSymbolic {
  @PasswordField(8, 16, PasswordComplexity.SYMBOLIC)
  pass: string;
}

class TestComprehensive {
  @PasswordField(8, 16, PasswordComplexity.COMPREHENSIVE)
  pass: string;
}

describe('PasswordField Decorator', () => {
  describe('Alphanumeric Scenario (Default)', () => {
    it('should pass with valid alphanumeric password', async () => {
      const obj = new TestAlphanumeric();
      obj.pass = 'Valid123';
      const errors = await validate(obj);
      expect(errors.length).toBe(0);
    });

    it('should fail if missing numbers', async () => {
      const obj = new TestAlphanumeric();
      obj.pass = 'NoNumber';
      const errors = await validate(obj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.matches).toContain('uppercase, lowercase and number');
    });
  });

  describe('Symbolic Scenario', () => {
    it('should pass with letters and symbols', async () => {
      const obj = new TestSymbolic();
      obj.pass = 'Valid@Symbol';
      const errors = await validate(obj);
      expect(errors.length).toBe(0);
    });

    it('should fail if missing symbols', async () => {
      const obj = new TestSymbolic();
      obj.pass = 'Valid123'; // No symbol
      const errors = await validate(obj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.matches).toContain('uppercase, lowercase and special character');
    });
  });

  describe('Comprehensive Scenario', () => {
    it('should pass with all required types', async () => {
      const obj = new TestComprehensive();
      obj.pass = 'V@lid123';
      const errors = await validate(obj);
      expect(errors.length).toBe(0);
    });

    it('should fail if missing number', async () => {
      const obj = new TestComprehensive();
      obj.pass = 'Valid@Symbol';
      const errors = await validate(obj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.matches).toContain('uppercase, lowercase, number and special character');
    });
  });

  describe('General Constraints', () => {
    it('should fail if too short', async () => {
      const obj = new TestAlphanumeric();
      obj.pass = 'V1';
      const errors = await validate(obj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isLength).toBeDefined();
    });

    it('should fail if too long', async () => {
      const obj = new TestAlphanumeric();
      obj.pass = 'Valid123Valid123Valid123';
      const errors = await validate(obj);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
