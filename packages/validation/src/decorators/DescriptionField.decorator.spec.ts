import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DescriptionField } from './DescriptionField.decorator';
import 'reflect-metadata';

class TestDescription {
  @DescriptionField('Bio', 10, 50)
  bio: string;
}

describe('DescriptionField', () => {
  it('should validate length and allowed characters', async () => {
    const obj = new TestDescription();
    obj.bio = 'Short';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.bio = 'This is a valid description that is long enough.';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should transform text to lowercase', async () => {
    const raw = { bio: 'THIS IS A BIO' };
    const instance = plainToInstance(TestDescription, raw);
    expect(instance.bio).toBe('this is a bio');
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestDescription();
    obj.bio = 'DROP TABLE users; -- valid looking text';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });
});
