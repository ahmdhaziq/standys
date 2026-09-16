import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DailyTasksService } from './../src/modules/daily-tasks/daily-tasks.service';
import { JwtAuthGuard } from './../src/modules/auth/guards/jwt-auth.guard';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const dailyTasksService = {
    updateCompletionStatus: jest.fn(),
    getIncompleteDailyTasks: jest.fn(),
    carryForwardDailyTask: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DailyTasksService)
      .useValue(dailyTasksService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: unknown } };
        }) => {
          context.switchToHttp().getRequest().user = {
            id: 7,
            email: 'user@example.com',
          };
          return true;
        },
      })
      .compile();

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

  it('accepts a guarded completion-status update and validates its DTO', async () => {
    dailyTasksService.updateCompletionStatus.mockResolvedValue({
      status: 'success',
      data: {
        id: 3,
        status: 'COMPLETED',
        completedAt: '2026-09-15T09:30:00.000Z',
      },
      meta: null,
    });

    await request(app.getHttpServer())
      .post('/daily-tasks/update')
      .send({
        dailyTaskId: 3,
        status: 'COMPLETED',
        completedAt: '2026-09-15T09:30:00.000Z',
      })
      .expect(201);

    expect(dailyTasksService.updateCompletionStatus).toHaveBeenCalledWith(
      {
        dailyTaskId: 3,
        status: 'COMPLETED',
        completedAt: '2026-09-15T09:30:00.000Z',
      },
      { id: 7, email: 'user@example.com' },
    );

    await request(app.getHttpServer())
      .post('/daily-tasks/update')
      .send({
        dailyTaskId: 3,
        status: 'COMPLETED',
        completedAt: '2026-09-15T09:30:00.000Z',
        userId: 8,
      })
      .expect(400);

    dailyTasksService.updateCompletionStatus.mockRejectedValueOnce(
      new UnauthorizedException(),
    );
    await request(app.getHttpServer())
      .post('/daily-tasks/update')
      .send({
        dailyTaskId: 8,
        status: 'COMPLETED',
        completedAt: '2026-09-15T09:30:00.000Z',
      })
      .expect(401);
  });

  it('accepts a guarded restoration payload', async () => {
    dailyTasksService.updateCompletionStatus.mockResolvedValue({
      status: 'success',
      data: { id: 3, status: 'PENDING', completedAt: null },
      meta: null,
    });

    await request(app.getHttpServer())
      .post('/daily-tasks/update')
      .send({ dailyTaskId: 3, status: 'PENDING', completedAt: null })
      .expect(201);

    expect(dailyTasksService.updateCompletionStatus).toHaveBeenCalledWith(
      { dailyTaskId: 3, status: 'PENDING', completedAt: null },
      { id: 7, email: 'user@example.com' },
    );
  });

  it('accepts an overdue query and carry-forward command', async () => {
    dailyTasksService.getIncompleteDailyTasks.mockResolvedValue({ status: 'success', data: [], meta: null });
    await request(app.getHttpServer())
      .get('/daily-tasks/incomplete?taskDate=2026-09-16')
      .expect(200);
    expect(dailyTasksService.getIncompleteDailyTasks).toHaveBeenCalledWith(
      { id: 7, email: 'user@example.com' }, '2026-09-16',
    );

    dailyTasksService.carryForwardDailyTask.mockResolvedValue({ status: 'success', data: { id: 3 }, meta: null });
    await request(app.getHttpServer())
      .post('/daily-tasks/carry-forward')
      .send({ dailyTaskId: 3, taskDate: '2026-09-16' })
      .expect(201);
    expect(dailyTasksService.carryForwardDailyTask).toHaveBeenCalledWith(
      { dailyTaskId: 3, taskDate: '2026-09-16' }, { id: 7, email: 'user@example.com' },
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
