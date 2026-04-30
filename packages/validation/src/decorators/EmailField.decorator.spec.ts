import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EmailField } from './EmailField.decorator';
import 'reflect-metadata';

class TestEmail {
  @EmailField()
  email: string;
}

describe('EmailField', () => {
  it('should validate email format correctly', async () => {
    const obj = new TestEmail();
    obj.email = 'not-an-email';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.email = 'test@example.com';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should transform email to lowercase', async () => {
    const raw = { email: 'TEST@EXAMPLE.COM' };
    const instance = plainToInstance(TestEmail, raw);
    expect(instance.email).toBe('test@example.com');
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestEmail();
    obj.email = 'admin@example.com; DROP TABLE users';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });
});
