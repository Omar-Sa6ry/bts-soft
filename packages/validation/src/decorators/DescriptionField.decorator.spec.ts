import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DescriptionField } from './DescriptionField.decorator';
import 'reflect-metadata';

class TestDescription {
  @DescriptionField('Bio', 10, 50)
  bio: string;
}

class TestRequiredDescription {
  @DescriptionField('Bio', 10, 50, false, true, false)
  bio: string;
}

class TestNoSqlCheckDescription {
  @DescriptionField('Bio', 10, 50, false, true, true, false)
  bio: string;
}

describe('DescriptionField', () => {
  it('should validate length and allowed characters', async () => {
    const obj = new TestDescription();
    obj.bio = 'Short';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.bio = 'This is a valid description that is long enough.';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should validate Arabic description successfully', async () => {
    const obj = new TestDescription();
    obj.bio = '\u0648\u0635\u0641 \u0628\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629';
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should transform text to lowercase', async () => {
    const raw = { bio: 'THIS IS A BIO' };
    const instance = plainToInstance(TestDescription, raw);
    expect(instance.bio).toBe('this is a bio');
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestDescription();
    obj.bio = 'DROP TABLE users; -- valid looking text';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should support optional behavior by default', async () => {
    const obj = new TestDescription();
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should support required behavior when optional is false', async () => {
    const obj = new TestRequiredDescription();
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should skip SQL injection check when checkSql is false', async () => {
    const obj = new TestNoSqlCheckDescription();
    obj.bio = 'SELECT fields FROM users';
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });
});
