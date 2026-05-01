import { plainToInstance } from 'class-transformer';
import { CurrentUserDto } from './currentUser.dto';

describe('CurrentUserDto', () => {
  it('should transform plain object to instance', () => {
    const plain = { id: '123', email: 'test@example.com', roles: ['admin'] };
    const instance = plainToInstance(CurrentUserDto, plain, { excludeExtraneousValues: true });
    
    expect(instance).toBeInstanceOf(CurrentUserDto);
    expect(instance.id).toBe('123');
    expect(instance.email).toBe('test@example.com');
    expect(instance.roles).toEqual(['admin']);
  });

  it('should be able to instantiate with new', () => {
    const dto = new CurrentUserDto();
    dto.id = '1';
    expect(dto.id).toBe('1');
  });
});
