import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { IsString, Min } from 'class-validator';
import { Controller, Post, Body } from '@nestjs/common';
import '../src';

class ValidationDto {
  @IsString({ message: 'Title must be a string' })
  title: string;

  @Min(0, { message: 'Count must be positive' })
  count: number;
}

@Controller('pipe-test')
class PipeTestController {
  @Post('validate')
  validate(@Body() dto: ValidationDto) {
    return dto;
  }
}

describe('ValidationPipe Monkey-Patch (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PipeTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should format errors as an array in HTTP response body', async () => {
    const invalidData = { title: 123, count: -5 };

    const response = await request(app.getHttpServer())
      .post('/pipe-test/validate')
      .send(invalidData)
      .expect(400);

    expect(response.body.message).toBeDefined();
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toContain('Title must be a string');
    expect(response.body.message).toContain('Count must be positive');
  });
});
