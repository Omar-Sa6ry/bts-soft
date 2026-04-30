import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TextField } from './TextField.decorator';
import 'reflect-metadata';

class TestText {
  @TextField('Title', 3, 10)
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
});
