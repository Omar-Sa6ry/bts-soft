import { validate } from 'class-validator';
import { BooleanField } from './BooleanField.decorator';
import 'reflect-metadata';

class TestBoolean {
  @BooleanField()
  isActive: boolean;

  @BooleanField(true)
  isOptional?: boolean;
}

describe('BooleanField', () => {
  it('should validate boolean values correctly', async () => {
    const obj = new TestBoolean();
    obj.isActive = true;
    let errors = await validate(obj);
    expect(errors.length).toBe(0);

    (obj as any).isActive = 'not-a-boolean';
    errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should allow null/undefined if nullable is true (logic check)', async () => {
    const obj = new TestBoolean();
    obj.isActive = false;
    obj.isOptional = undefined;
    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });
});
