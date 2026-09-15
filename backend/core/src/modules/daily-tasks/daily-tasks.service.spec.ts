import { Test, TestingModule } from '@nestjs/testing';
import { DailyTasksService } from './daily-tasks.service';
import { DailyTasksRepository } from './daily-tasks.repository';
import { TasksService } from '../tasks/tasks.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('DailyTasksService', () => {
  let service: DailyTasksService;
  const dailyTasksRepository = {
    getDailyTasks: jest.fn(),
    findDailyTaskForUser: jest.fn(),
    updateDailyTasks: jest.fn(),
  };
  const tasksService = {};
  const prisma = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyTasksService,
        { provide: DailyTasksRepository, useValue: dailyTasksRepository },
        { provide: TasksService, useValue: tasksService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DailyTasksService>(DailyTasksService);
  });

  it('completes an owned pending task through the generic update method', async () => {
    const user = { id: 7, email: 'user@example.com' };
    const dto = {
      dailyTaskId: 3,
      status: 'COMPLETED' as const,
      completedAt: '2026-09-15T09:30:00.000Z',
    };
    dailyTasksRepository.findDailyTaskForUser.mockResolvedValue({
      id: 3,
      status: 'PENDING',
    });
    dailyTasksRepository.updateDailyTasks.mockResolvedValue({
      id: 3,
      status: 'COMPLETED',
      completed_at: new Date(dto.completedAt),
    });

    await expect(
      service.updateCompletionStatus(dto, user),
    ).resolves.toMatchObject({
      status: 'success',
      data: {
        id: 3,
        status: 'COMPLETED',
        completedAt: new Date(dto.completedAt),
      },
    });
    expect(dailyTasksRepository.updateDailyTasks).toHaveBeenCalledWith(dto, 7);
  });

  it('rejects inaccessible, unchanged, and invalid completion requests', async () => {
    const user = { id: 7, email: 'user@example.com' };
    dailyTasksRepository.findDailyTaskForUser.mockResolvedValueOnce(null);
    await expect(
      service.updateCompletionStatus(
        {
          dailyTaskId: 3,
          status: 'COMPLETED',
          completedAt: '2026-09-15T09:30:00.000Z',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    dailyTasksRepository.findDailyTaskForUser.mockResolvedValueOnce({
      id: 3,
      status: 'COMPLETED',
    });
    await expect(
      service.updateCompletionStatus(
        {
          dailyTaskId: 3,
          status: 'COMPLETED',
          completedAt: '2026-09-15T09:30:00.000Z',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    dailyTasksRepository.findDailyTaskForUser.mockResolvedValueOnce({
      id: 3,
      status: 'PENDING',
    });
    await expect(
      service.updateCompletionStatus(
        { dailyTaskId: 3, status: 'PENDING', completedAt: null },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('restores an owned completed task only with a null completion date', async () => {
    const user = { id: 7, email: 'user@example.com' };
    const dto = {
      dailyTaskId: 3,
      status: 'PENDING' as const,
      completedAt: null,
    };
    dailyTasksRepository.findDailyTaskForUser.mockResolvedValue({
      id: 3,
      status: 'COMPLETED',
    });
    dailyTasksRepository.updateDailyTasks.mockResolvedValue({
      id: 3,
      status: 'PENDING',
      completed_at: null,
    });

    await expect(
      service.updateCompletionStatus(dto, user),
    ).resolves.toMatchObject({
      data: { status: 'PENDING', completedAt: null },
    });
    expect(dailyTasksRepository.updateDailyTasks).toHaveBeenCalledWith(dto, 7);

    await expect(
      service.updateCompletionStatus(
        {
          dailyTaskId: 3,
          status: 'PENDING',
          completedAt: '2026-09-15T09:30:00.000Z',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses the authenticated user id when fetching daily tasks', async () => {
    const rows = [{ id: 1, user_id: 7 }];
    dailyTasksRepository.getDailyTasks.mockResolvedValue(rows);

    await expect(
      service.getDailyTasks({ id: 7, email: 'user@example.com' }, '2026-09-12'),
    ).resolves.toEqual({ status: 'success', data: rows, meta: null });

    expect(dailyTasksRepository.getDailyTasks).toHaveBeenCalledWith(
      7,
      '2026-09-12',
    );
  });
});
