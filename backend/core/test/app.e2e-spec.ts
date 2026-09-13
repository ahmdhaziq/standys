import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('rejects a missing refresh token', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400);
  });

  it('rejects a malformed refresh token without issuing an access token', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: 'malformed-token' })
      .expect(401)
      .expect(({ body }) => {
        const responseBody = body as { message: string };
        expect(responseBody.message).toBe('Invalid refresh token');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
