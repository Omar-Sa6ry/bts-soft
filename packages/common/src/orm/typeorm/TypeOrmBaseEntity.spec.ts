import { Logger } from '@nestjs/common';
import { TypeOrmBaseEntity } from './TypeOrmBaseEntity';

class TestTypeOrmEntity extends TypeOrmBaseEntity {}

describe('TypeOrmBaseEntity', () => {
  it('should have a ULID id', () => {
    const entity = new TestTypeOrmEntity();
    expect(entity.id).toBeDefined();
    expect(entity.id.length).toBe(26);
  });

  it('should log insert, update and remove using Logger', () => {
    const entity = new TestTypeOrmEntity();
    const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    
    entity.logInsert();
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Inserted'));
    
    entity.logUpdate();
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Updated'));
    
    entity.logRemove();
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Removed'));
    
    debugSpy.mockRestore();
  });
});
