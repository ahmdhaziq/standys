import { Test, TestingModule } from '@nestjs/testing';
import { DailyTasksController } from './daily-tasks.controller';
import { DailyTasksService } from './daily-tasks.service';

describe('DailyTasksController', () => {
  let controller: DailyTasksController;
  const dailyTasksService = {
    getDailyTasks: jest.fn(),
    getIncompleteDailyTasks: jest.fn(),
    updateCompletionStatus: jest.fn(),
    carryForwardDailyTask: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyTasksController],
      providers: [{ provide: DailyTasksService, useValue: dailyTasksService }],
    }).compile();

    controller = module.get<DailyTasksController>(DailyTasksController);
  });

  it('passes the JWT user to the service and does not accept a caller user id', async () => {
    const user = { id: 7, email: 'user@example.com' };
    dailyTasksService.getDailyTasks.mockResolvedValue({
      status: 'success',
      data: [],
      meta: null,
    });

    await controller.getDailyTasks({ user } as never, {
      taskDate: '2026-09-12',
    });

    expect(dailyTasksService.getDailyTasks).toHaveBeenCalledWith(
      user,
      '2026-09-12',
    );
  });

  it('passes update requests and the JWT user to completion-status orchestration', async () => {
    const user = { id: 7, email: 'user@example.com' };
    const dto = {
      dailyTaskId: 3,
      status: 'COMPLETED' as const,
      completedAt: '2026-09-15T09:30:00.000Z',
    };
    dailyTasksService.updateCompletionStatus.mockResolvedValue({
      status: 'success',
      data: {},
      meta: null,
    });

    await controller.updateDailyTask(dto, { user } as never);

    expect(dailyTasksService.updateCompletionStatus).toHaveBeenCalledWith(
      dto,
      user,
    );
  });

  it('passes overdue queries and carry-forward requests with the JWT user', async () => {
    const user = { id: 7, email: 'user@example.com' };
    dailyTasksService.getIncompleteDailyTasks.mockResolvedValue({ status: 'success', data: [], meta: null });
    dailyTasksService.carryForwardDailyTask.mockResolvedValue({ status: 'success', data: {}, meta: null });
    await controller.getIncompleteDailyTasks({ user } as never, { taskDate: '2026-09-16' });
    await controller.carryForwardDailyTask({ dailyTaskId: 3, taskDate: '2026-09-16' }, { user } as never);
    expect(dailyTasksService.getIncompleteDailyTasks).toHaveBeenCalledWith(user, '2026-09-16');
    expect(dailyTasksService.carryForwardDailyTask).toHaveBeenCalledWith({ dailyTaskId: 3, taskDate: '2026-09-16' }, user);
  });
});
