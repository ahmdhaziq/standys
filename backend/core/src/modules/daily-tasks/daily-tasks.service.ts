import { Injectable } from '@nestjs/common';
import { NewDailyTaskDto } from './dto/new-daily-task.dto';
import { TasksService } from '../tasks/tasks.service';
import { DailyTasksRepository } from './daily-tasks.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class DailyTasksService {
  constructor(
    private readonly dailyTasksRepository: DailyTasksRepository,
    private readonly tasksService: TasksService,
    private readonly prisma: PrismaService,
  ) {}

  async createDailyTask(dto: NewDailyTaskDto) {
    const exist = await this.tasksService.getTaskById(dto.taskId);
    if (!dto.taskId || !exist) {
      return this.prisma.$transaction(async (tx) => {
        // Create Parent Task
        const task = await this.tasksService.createTask(
          {
            title: dto.title,
            description: dto.description,
            userId: dto.userId,
          },
          tx,
        );
        if (!task) {
          throw new Error('Failed to create task');
        }

        await this.dailyTasksRepository.createDailyTask(
          {
            taskId: task.id,
            userId: dto.userId,
            taskDate: dto.taskDate,
            status: dto.status,
          },
          tx,
        );
      });
    }

    await this.dailyTasksRepository.createDailyTask(
      {
        taskId: dto.taskId,
        userId: dto.userId,
        taskDate: dto.taskDate,
        status: dto.status,
      },
      this.prisma,
    );

    return {
      status: 'success',
      data: {
        taskId: dto.taskId,
        userId: dto.userId,
        taskDate: dto.taskDate,
        status: dto.status,
        completedAt: null,
      },
      meta: null,
    };
  }

  async getDailyTasks(userId: number, taskDate: Date) {
    const dailyTasks = await this.dailyTasksRepository.getDailyTasks(
      userId,
      taskDate,
    );

    return {
      status: 'success',
      data: dailyTasks,
      meta: null,
    };
  }
}
