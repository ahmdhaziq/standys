import { Module } from '@nestjs/common';
import { DailyTasksService } from './daily-tasks.service';
import { DailyTasksController } from './daily-tasks.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { DailyTasksRepository } from './daily-tasks.repository';

@Module({
  providers: [DailyTasksService, DailyTasksRepository],
  controllers: [DailyTasksController],
  imports: [PrismaModule, TasksModule],
})
export class DailyTasksModule {}
