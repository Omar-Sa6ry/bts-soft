import { plainToInstance } from 'class-transformer';
import { PaginationInfo, PaginationDto } from './pagintion';

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
    it('should transform plain object to PaginationDto instance', () => {
      const plain = { page: 1, limit: 10 };
      const instance = plainToInstance(PaginationDto, plain, { excludeExtraneousValues: true });

      expect(instance).toBeInstanceOf(PaginationDto);
      expect(instance.page).toBe(1);
      expect(instance.limit).toBe(10);
    });

    it('should be able to instantiate with new', () => {
      const dto = new PaginationDto();
      expect(dto).toBeDefined();
    });
  });
});
