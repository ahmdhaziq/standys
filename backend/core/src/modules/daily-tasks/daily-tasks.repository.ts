import { Injectable } from '@nestjs/common';
import { CreateDailyTaskDto } from './dto/create-daily-task.dto';
import { UpdateDailyTaskDto } from './dto/update-daily-task.dto';
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
        user_id: userId,
        OR: [{ task_id: null }, { task: { is: { user_id: userId } } }],
        task_date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        task: true,
      },
    });
  }

  async getIncompleteDailyTasks(userId: number, taskDate: string) {
    const before = new Date(`${taskDate}T00:00:00.000Z`);
    return await this.prisma.daily_tasks.findMany({
      where: {
        user_id: userId,
        status: 'PENDING',
        task_date: { lt: before },
        OR: [{ task_id: null }, { task: { is: { user_id: userId } } }],
      },
      include: { task: true },
      orderBy: { task_date: 'desc' },
    });
  }

  async findDailyTaskForUser(dailyTaskId: number, userId: number) {
    return this.prisma.daily_tasks.findFirst({
      where: {
        id: dailyTaskId,
        user_id: userId,
        OR: [{ task_id: null }, { task: { is: { user_id: userId } } }],
      },
      include: { task: true },
    });
  }

  async updateDailyTasks(
    dto: UpdateDailyTaskDto,
    userId: number,
    options: {
      expectedStatus?: string;
      beforeTaskDate?: Date;
      taskDate?: Date;
    } = {},
  ) {
    const where = {
      id: dto.dailyTaskId,
      user_id: userId,
      OR: [{ task_id: null }, { task: { is: { user_id: userId } } }],
      ...(options.expectedStatus ? { status: options.expectedStatus } : {}),
      ...(options.beforeTaskDate
        ? { task_date: { lt: options.beforeTaskDate } }
        : {}),
    };
    const data = {
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.completedAt !== undefined
        ? {
            completed_at:
              dto.completedAt === null ? null : new Date(dto.completedAt),
          }
        : {}),
      ...(options.taskDate ? { task_date: options.taskDate } : {}),
    };
    const result = await this.prisma.daily_tasks.updateMany({
      where,
      data,
    });

    if (result.count === 0) return null;

    return this.prisma.daily_tasks.findFirst({
      where,
      include: { task: true },
    });
  }
}
