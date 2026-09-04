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
    userId: number,
  ) {
    return await db.daily_tasks.create({
      data: {
        ...(dto.taskId !== undefined && dto.taskId !== null
          ? {
              task: {
                connect: {
                  id: dto.taskId,
                },
              },
            }
          : {}),
        user: {
          connect: {
            id: userId,
          },
        },
        task_date: dto.taskDate,
        status: dto.status,
        completed_at: dto.completedAt,
      },
    });
  }

  async getDailyTasks(userId: number, taskDate: string) {
    const start = new Date(`${taskDate}T00:00:00.000Z`);
    const end = new Date(`${taskDate}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    return await this.prisma.daily_tasks.findMany({
      where: {
        user: {
          id: userId,
        },
        task_date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        task: true,
      },
    });
  }
}
