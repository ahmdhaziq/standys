import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TasksRepository } from './tasks.repository';

@Module({
  providers: [TasksService, TasksRepository],
  controllers: [TasksController],
  imports: [PrismaModule],
})
export class TasksModule {}
