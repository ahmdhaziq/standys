import { Test, TestingModule } from '@nestjs/testing';
import { DailyTasksController } from './daily-tasks.controller';
import { DailyTasksService } from './daily-tasks.service';

describe('DailyTasksController', () => {
  let controller: DailyTasksController;
  const dailyTasksService = {
    getDailyTasks: jest.fn(),
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
});
