import { Test, TestingModule } from '@nestjs/testing';
import { DailyTasksService } from './daily-tasks.service';
import { DailyTasksRepository } from './daily-tasks.repository';
import { TasksService } from '../tasks/tasks.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

describe('DailyTasksService', () => {
  let service: DailyTasksService;
  const dailyTasksRepository = {
    getDailyTasks: jest.fn(),
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
