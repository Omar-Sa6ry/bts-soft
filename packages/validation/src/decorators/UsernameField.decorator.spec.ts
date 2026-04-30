import { validate } from 'class-validator';
import { UsernameField } from './UsernameField.decorator';
import 'reflect-metadata';

class TestUsername {
  @UsernameField()
  username: string;
}

describe('UsernameField', () => {
  it('should validate alphanumeric and no leading numbers', async () => {
    const obj = new TestUsername();
    obj.username = '1invalid';
    let errors = await validate(obj);
    expect(errors.find(e => e.property === 'username')).toBeDefined();

    obj.username = 'omar_sabry';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestUsername();
    obj.username = 'admin; DROP TABLE users';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });
});
