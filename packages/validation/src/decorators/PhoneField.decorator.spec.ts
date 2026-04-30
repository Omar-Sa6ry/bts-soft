import { validate } from 'class-validator';
import { PhoneField } from './PhoneField.decorator';
import 'reflect-metadata';

class TestPhone {
  @PhoneField('EG')
  phone: string;
}

describe('PhoneField', () => {
  it('should validate phone numbers based on country code', async () => {
    const obj = new TestPhone();
    obj.phone = '123';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.phone = '+201012345678';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestPhone();
    obj.phone = '+201012345678; DROP TABLE users';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });
});
