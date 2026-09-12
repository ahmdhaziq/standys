import { Injectable } from '@nestjs/common';
import { NewDailyTaskDto } from './dto/new-daily-task.dto';
import { TasksService } from '../tasks/tasks.service';
import { DailyTasksRepository } from './daily-tasks.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ValidateUser } from '../auth/types/validate';

interface DailyTaskRecord {
  task_id: number | null;
  task_date: Date;
  status: string;
}

@Injectable()
export class DailyTasksService {
  constructor(
    private readonly dailyTasksRepository: DailyTasksRepository,
    private readonly tasksService: TasksService,
    private readonly prisma: PrismaService,
  ) {}

  async createDailyTask(dto: NewDailyTaskDto, user: ValidateUser) {
    let dailyTask: DailyTaskRecord | undefined;

    if (dto.taskId) {
      const exist = await this.tasksService.getTaskById(dto.taskId);
      if (exist) {
        dailyTask = await this.dailyTasksRepository.createDailyTask(
          {
            taskId: exist.id,
            taskDate: new Date().toISOString(),
            status: 'PENDING',
          },
          this.prisma,
          user.id,
        );
      }
    } else {
      await this.prisma.$transaction(async (tx) => {
        // Create Parent Task
        const task = await this.tasksService.createTask(
          {
            title: dto.title,
            description: dto.description,
            userId: user.id,
          },
          tx,
        );
        if (!task) {
          throw new Error('Failed to create task');
        }

        dailyTask = await this.dailyTasksRepository.createDailyTask(
          {
            taskId: task.id ? task.id : null,
            taskDate: new Date().toISOString(),
            status: 'PENDING',
          },
          tx,
          user.id,
        );
      });
    }
    if (!dailyTask) {
      throw new Error('Failed to create daily task');
    }

    console.log('dailyTask', dailyTask);

    return {
      status: 'success',
      data: {
        taskId: dailyTask.task_id,
        taskDate: dailyTask.task_date,
        status: dailyTask.status,
        completedAt: null,
      },
      meta: null,
    };
  }

  async getDailyTasks(user: ValidateUser, taskDate: string) {
    const dailyTasks = await this.dailyTasksRepository.getDailyTasks(
      user.id,
      taskDate,
    );

    return {
      status: 'success',
      data: dailyTasks,
      meta: null,
    };
  }
}
