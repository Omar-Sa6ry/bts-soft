import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DateField } from './DateField.decorator';
import 'reflect-metadata';

class TestDate {
  @DateField('Birth Date')
  date: Date;
}

describe('DateField', () => {
  it('should validate date objects correctly', async () => {
    const obj = new TestDate();
    obj.date = new Date();
    let errors = await validate(obj);
    expect(errors.length).toBe(0);

    (obj as any).date = 'not-a-date';
    errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should transform strings to date objects', async () => {
    const raw = { date: '2024-01-01' };
    const instance = plainToInstance(TestDate, raw);
    expect(instance.date).toBeInstanceOf(Date);
    expect(instance.date.getFullYear()).toBe(2024);
  });
});
