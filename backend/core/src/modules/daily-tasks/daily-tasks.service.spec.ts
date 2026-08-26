import { Test, TestingModule } from '@nestjs/testing';
import { DailyTasksService } from './daily-tasks.service';

describe('DailyTasksService', () => {
  let service: DailyTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyTasksService],
    }).compile();

    service = module.get<DailyTasksService>(DailyTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
