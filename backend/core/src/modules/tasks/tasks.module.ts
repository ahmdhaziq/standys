import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  providers: [TasksService],
  controllers: [TasksController],
  imports: [PrismaModule],
})
export class TasksModule {}
