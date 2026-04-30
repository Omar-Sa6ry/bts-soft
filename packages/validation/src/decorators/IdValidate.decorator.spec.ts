import { validate } from 'class-validator';
import { IdField } from './IdValidate.decorator';
import 'reflect-metadata';

class TestId {
  @IdField('User', 26)
  id: string;
}

describe('IdField', () => {
  it('should validate ID length and type', async () => {
    const obj = new TestId();
    obj.id = 'short';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.id = '12345678901234567890123456'; // 26 chars
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestId();
    obj.id = '12345678901234567890123456 OR 1=1';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });
});
