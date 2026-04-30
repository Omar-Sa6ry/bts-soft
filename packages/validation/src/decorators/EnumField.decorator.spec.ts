import { validate } from 'class-validator';
import { EnumField } from './EnumField.decorator';
import 'reflect-metadata';

enum TestEnum {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

class TestEnumClass {
  @EnumField(TestEnum, 'Role')
  role: TestEnum;
}

describe('EnumField', () => {
  it('should validate enum values correctly', async () => {
    const obj = new TestEnumClass();
    obj.role = TestEnum.ADMIN;
    let errors = await validate(obj);
    expect(errors.length).toBe(0);

    (obj as any).role = 'INVALID';
    errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isEnum).toContain('Must be a valid Role');
  });
});
