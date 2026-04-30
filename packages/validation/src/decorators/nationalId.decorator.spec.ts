import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NationalIdField } from './nationalId.decorator';
import 'reflect-metadata';

class TestNid {
  @NationalIdField()
  nid: string;
}

describe('NationalIdField', () => {
  it('should validate Egyptian National ID correctly', async () => {
    const obj = new TestNid();
    obj.nid = '12345678901234'; // Starts with 1 (invalid)
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.nid = '29901011234567'; // Valid
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should strip non-digits during transformation', async () => {
    const raw = { nid: '299-0101-12345-67' };
    const instance = plainToInstance(TestNid, raw);
    expect(instance.nid).toBe('29901011234567');
  });
});
