import { validate } from 'class-validator';
import { NumberField } from './NumberField.decorator';
import 'reflect-metadata';

class TestNumber {
  @NumberField('Age', 18, 100)
  age: number;

  @NumberField('Score', 0, 10, true)
  score: number;
}

describe('NumberField', () => {
  it('should validate min and max values', async () => {
    const obj = new TestNumber();
    obj.age = 15;
    let errors = await validate(obj);
    expect(errors.find(e => e.property === 'age')).toBeDefined();

    obj.age = 25;
    errors = await validate(obj);
    expect(errors.find(e => e.property === 'age')).toBeUndefined();
  });

  it('should handle isInt correctly', async () => {
    const obj = new TestNumber();
    obj.score = 5.5;
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });
});
