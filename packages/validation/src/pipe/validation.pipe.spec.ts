import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { IsString, Min } from 'class-validator';
import './validation.pipe'; // ensure patch is loaded

class TestDto {
  @IsString({ message: 'Name must be a string' })
  name: string;

  @Min(10, { message: 'Age must be at least 10' })
  age: number;
}

describe('ValidationPipe Monkey-Patch Unit Test', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({ transform: true });
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should successfully validate correct data', async () => {
    const validData = { name: 'Omar', age: 28 };
    const result = await pipe.transform(validData, {
      type: 'body',
      metatype: TestDto,
    });
    expect(result).toEqual(validData);
  });

  it('should throw BadRequestException with formatted message and array response on invalid data', async () => {
    const invalidData = { name: 123 as any, age: 5 };

    try {
      await pipe.transform(invalidData, {
        type: 'body',
        metatype: TestDto,
      });
      fail('ValidationPipe should have thrown BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const badRequest = error as BadRequestException;

      // 1. Verify exception response (used by REST API)
      const response = badRequest.getResponse() as any;
      expect(response.statusCode).toBe(400);
      expect(response.error).toBe('Bad Request');
      expect(response.message).toBeDefined();
      expect(Array.isArray(response.message)).toBe(true);
      expect(response.message).toContain('Name must be a string');
      expect(response.message).toContain('Age must be at least 10');

      // 2. Verify exception message property (read by default GraphQL formatting)
      // It should be a joined string of all validation errors instead of "Bad Request Exception"
      expect(badRequest.message).toContain('Name must be a string');
      expect(badRequest.message).toContain('Age must be at least 10');
      expect(badRequest.message).not.toBe('Bad Request Exception');
    }
  });
});
