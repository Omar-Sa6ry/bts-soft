import { ResponseFormatter } from './ResponseFormatter';

describe('ResponseFormatter', () => {
  describe('formatSuccess', () => {
    it('should format simple object data correctly', () => {
      const data = { id: 1, name: 'Test' };
      const result = ResponseFormatter.formatSuccess(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Request successful');
      expect(result.timeStamp).toBeDefined();
    });

    it('should handle array data correctly', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = ResponseFormatter.formatSuccess(data);

      expect(result.data).toEqual(data);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle null data', () => {
      const result = ResponseFormatter.formatSuccess(null);
      expect(result.data).toBeNull();
    });

    it('should handle undefined data', () => {
      const result = ResponseFormatter.formatSuccess(undefined);
      expect(result.data).toBeNull();
    });

    it('should extract pagination and items if present', () => {
      const data = {
        items: [1, 2, 3],
        pagination: { total: 3 },
        message: 'Custom message'
      };
      const result = ResponseFormatter.formatSuccess(data);

      expect(result.items).toEqual([1, 2, 3]);
      expect(result.pagination).toEqual({ total: 3 });
      expect(result.message).toBe('Custom message');
    });
  });

  describe('formatError', () => {
    it('should format generic error correctly', () => {
      const error = new Error('Test error');
      const result = ResponseFormatter.formatError(error);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Test error');
      expect(result.statusCode).toBe(500);
    });

    it('should handle NestJS HttpException structure', () => {
      const error = {
        response: { message: 'Forbidden', statusCode: 403, error: 'Forbidden' },
        status: 403
      };
      const result = ResponseFormatter.formatError(error);

      expect(result.statusCode).toBe(403);
      expect(result.message).toBe('Forbidden');
      expect(result.error).toBe('Forbidden');
    });

    it('should handle nested items in data object', () => {
      const input = { data: { items: [1, 2] } };
      const result = ResponseFormatter.formatSuccess(input);
      expect(result.items).toEqual([1, 2]);
    });

    it('should handle primitive data in data object', () => {
      const inputString = { data: 'test-string' };
      const resultString = ResponseFormatter.formatSuccess(inputString);
      expect(resultString.data).toBe('test-string');

      const inputNumber = { data: 123 };
      const resultNumber = ResponseFormatter.formatSuccess(inputNumber);
      expect(resultNumber.data).toBe(123);
    });

    it('should handle errors array in error object', () => {
      const error = {
        errors: [{ message: 'Error 1' }, { message: 'Error 2' }]
      };
      const result = ResponseFormatter.formatError(error);
      expect(result.message).toBe('Error 1, Error 2');
    });

    it('should handle missing error information', () => {
      const result = ResponseFormatter.formatError({});
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.statusCode).toBe(500);
      expect(result.error).toBe('Unknown error');
    });
  });
});
