import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationInfo, PaginationDto } from './pagination';

describe('Pagination DTOs', () => {
  describe('PaginationInfo', () => {
    it('should transform plain object to PaginationInfo instance', () => {
      const plain = { totalPages: 10, currentPage: 1, totalItems: 100 };
      const instance = plainToInstance(PaginationInfo, plain, { excludeExtraneousValues: true });

      expect(instance).toBeInstanceOf(PaginationInfo);
      expect(instance.totalPages).toBe(10);
      expect(instance.currentPage).toBe(1);
      expect(instance.totalItems).toBe(100);
    });

    it('should be able to instantiate with new', () => {
      const info = new PaginationInfo();
      expect(info).toBeDefined();
    });
  });

  describe('PaginationDto', () => {
    it('should transform plain object to PaginationDto instance with defaults', () => {
      const plain = { page: '2', limit: '20' };
      const instance = plainToInstance(PaginationDto, plain);

      expect(instance).toBeInstanceOf(PaginationDto);
      expect(instance.page).toBe(2);
      expect(instance.limit).toBe(20);
    });

    it('should validate valid pagination parameters', async () => {
      const dto = plainToInstance(PaginationDto, { page: 1, limit: 50 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid page numbers (less than 1)', async () => {
      const dto = plainToInstance(PaginationDto, { page: 0, limit: 10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should reject limits exceeding maximum allowed threshold (limit > 100)', async () => {
      const dto = plainToInstance(PaginationDto, { page: 1, limit: 150 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });
  });
});
