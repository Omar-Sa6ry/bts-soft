import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './test-app.module';
import { setupInterceptors } from '../../src/interceptors/main.interceptor';

describe('Common Package (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    setupInterceptors(app);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('REST API Integration', () => {
    it('/test/hello (GET) - should return translated hello', () => {
      return request(app.getHttpServer())
        .get('/test/hello')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBe('Hello World');
        });
    });

    it('/test/hello (GET) - should support language header', () => {
      return request(app.getHttpServer())
        .get('/test/hello')
        .set('accept-language', 'ar')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.message).toBe('مرحباً بالعالم');
        });
    });

    it('/test/secure (GET) - should return null user if not logged in', () => {
      return request(app.getHttpServer())
        .get('/test/secure')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeNull();
        });
    });

    it('/test/sql (POST) - should block SQL injection attempts', () => {
      return request(app.getHttpServer())
        .post('/test/sql')
        .send({ query: 'SELECT * FROM users' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid input detected');
        });
    });

    it('/test/error (GET) - should be handled by RestExceptionFilter', () => {
      return request(app.getHttpServer())
        .get('/test/error')
        .expect(500)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
        });
    });
  });

  describe('GraphQL Integration', () => {
    it('should handle GraphQL queries', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: '{ helloGql }',
        })
        .expect(200)
        .expect((res) => {
          if (res.body.errors) {
            console.error('GQL Query Errors:', JSON.stringify(res.body.errors, null, 2));
          }
          expect(res.body.data.helloGql).toBe('GQL Hello');
        });
    });

    it('should handle GraphQL mutations with BaseResponse', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              testMutation(id: "123") {
                success
                message
                data {
                  id
                  username
                }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          if (res.body.errors) {
            console.error('GQL Mutation Errors:', JSON.stringify(res.body.errors, null, 2));
          }
          expect(res.body.data.testMutation.success).toBe(true);
          expect(res.body.data.testMutation.data.id).toBe('123');
        });
    });
  });

  describe('Throttling Integration', () => {
    it('should support throttling', async () => {
      const server = app.getHttpServer();
      const endpoint = `/test/throttle-me?t=${Date.now()}`;
      // We set limit to 100 in TestAppModule
      for (let i = 0; i < 100; i++) {
        await request(server).get(endpoint).expect(200);
      }
      return request(server)
        .get(endpoint)
        .expect(429);
    });
  });
});
