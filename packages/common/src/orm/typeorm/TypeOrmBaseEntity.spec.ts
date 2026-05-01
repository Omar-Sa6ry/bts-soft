import { TypeOrmBaseEntity } from './TypeOrmBaseEntity';

class TestTypeOrmEntity extends TypeOrmBaseEntity {}

describe('TypeOrmBaseEntity', () => {
  it('should have a ULID id', () => {
    const entity = new TestTypeOrmEntity();
    expect(entity.id).toBeDefined();
    expect(entity.id.length).toBe(26);
  });

  it('should log insert, update and remove', () => {
    const entity = new TestTypeOrmEntity();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    
    entity.logInsert();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Inserted'));
    
    entity.logUpdate();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Updated'));
    
    entity.logRemove();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Removed'));
    
    logSpy.mockRestore();
  });
});
