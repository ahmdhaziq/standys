import { Module } from '@nestjs/common';
import { DailyTasksService } from './daily-tasks.service';
import { DailyTasksController } from './daily-tasks.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  providers: [DailyTasksService],
  controllers: [DailyTasksController],
  imports: [PrismaModule, TasksModule],
})
export class DailyTasksModule {}
