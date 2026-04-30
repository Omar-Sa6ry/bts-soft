import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NameField } from './NameField.decorator';
import 'reflect-metadata';

class TestName {
  @NameField('Full Name')
  name: string;
}

describe('NameField', () => {
  it('should validate letters and spaces only', async () => {
    const obj = new TestName();
    obj.name = 'Omar123';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.name = 'Omar Sabry';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should transform text to capitalized words', async () => {
    const raw = { name: 'omar sabry' };
    const instance = plainToInstance(TestName, raw);
    expect(instance.name).toBe('Omar Sabry');
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestName();
    obj.name = 'Omar; DELETE FROM users';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });
});
