import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CapitalTextField } from './CapitalField.decorator';
import 'reflect-metadata';

class TestCapital {
  @CapitalTextField('City')
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
});
