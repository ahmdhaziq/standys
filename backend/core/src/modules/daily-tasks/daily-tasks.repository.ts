import { Injectable } from '@nestjs/common';
import { CreateDailyTaskDto } from './dto/create-daily-task.dto';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Prisma, PrismaClient } from 'generated/prisma/client';

@Injectable()
export class DailyTasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDailyTask(
    dto: CreateDailyTaskDto,
    db: PrismaClient | Prisma.TransactionClient,
  ) {
    await db.daily_tasks.create({
      data: {
        task_id: dto.taskId,
        user_id: dto.userId,
        task_date: dto.taskDate,
        status: dto.status,
        completed_at: dto.completedAt,
      },
    });
  }

  async getDailyTasks(userId: number, taskDate: Date) {
    return await this.prisma.daily_tasks.findMany({
      where: {
        user_id: userId,
        task_date: taskDate,
      },
    });
  }
}
