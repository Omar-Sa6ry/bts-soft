import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CapitalTextField } from './CapitalField.decorator';
import 'reflect-metadata';

class TestCapital {
  @CapitalTextField('City')
  city: string;
}

class TestRequiredCapital {
  @CapitalTextField('City', 1, 255, false, true, false)
  city: string;
}

class TestNoSqlCheckCapital {
  @CapitalTextField('City', 1, 255, false, true, true, false)
  city: string;
}

describe('CapitalTextField', () => {
  it('should validate letters and spaces only', async () => {
    const obj = new TestCapital();
    obj.city = 'Cairo 123';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.city = 'Cairo';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should validate Arabic words successfully', async () => {
    const obj = new TestCapital();
    obj.city = '\u0627\u0644\u0642\u0627\u0647\u0631\u0629';
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should transform text to capitalized words', async () => {
    const raw = { city: 'new york city' };
    const instance = plainToInstance(TestCapital, raw);
    expect(instance.city).toBe('New York City');
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestCapital();
    obj.city = 'SELECT * FROM users';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should support optional behavior by default', async () => {
    const obj = new TestCapital();
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should support required behavior when optional is false', async () => {
    const obj = new TestRequiredCapital();
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should skip SQL injection check when checkSql is false', async () => {
    const obj = new TestNoSqlCheckCapital();
    obj.city = 'SELECT fields FROM users';
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });
});
