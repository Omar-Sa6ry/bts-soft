import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TextField } from './TextField.decorator';
import 'reflect-metadata';

class TestText {
  @TextField('Title', 3, 10)
  title: string;
}

class TestRequiredText {
  @TextField('Title', 3, 10, false, true, false)
  title: string;
}

class TestNoSqlCheckText {
  @TextField('Title', 3, 50, false, true, true, false)
  title: string;
}

describe('TextField', () => {
  it('should validate length correctly', async () => {
    const obj = new TestText();
    obj.title = 'Ab';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.title = 'Valid';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should validate Arabic text successfully', async () => {
    const obj = new TestText();
    obj.title = '\u0639\u0646\u0648\u0627\u0646 \u0639\u0631\u0628\u064a';
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should transform text to lowercase', async () => {
    const raw = { title: 'HELLO' };
    const instance = plainToInstance(TestText, raw);
    expect(instance.title).toBe('hello');
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestText();
    obj.title = 'admin OR 1=1';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should support optional behavior by default', async () => {
    const obj = new TestText();
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should support required behavior when optional is false', async () => {
    const obj = new TestRequiredText();
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should skip SQL injection check when checkSql is false', async () => {
    const obj = new TestNoSqlCheckText();
    obj.title = 'SELECT fields FROM users';
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });
});
