import { Test, TestingModule } from '@nestjs/testing';
import { DailyTasksController } from './daily-tasks.controller';

describe('DailyTasksController', () => {
  let controller: DailyTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyTasksController],
    }).compile();

    controller = module.get<DailyTasksController>(DailyTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
