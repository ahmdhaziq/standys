import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { NewDailyTaskDto } from './dto/new-daily-task.dto';
import { TasksService } from '../tasks/tasks.service';
import { DailyTasksRepository } from './daily-tasks.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ValidateUser } from '../auth/types/validate';
import { UpdateDailyTaskDto } from './dto/update-daily-task.dto';
import { CarryForwardDailyTaskDto } from './dto/carry-forward-daily-task.dto';

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

  async getIncompleteDailyTasks(user: ValidateUser, taskDate: string) {
    const dailyTasks = await this.dailyTasksRepository.getIncompleteDailyTasks(
      user.id,
      taskDate,
    );
    return { status: 'success', data: dailyTasks, meta: null };
  }

  async updateDailyTasks(dto: UpdateDailyTaskDto, user: ValidateUser) {
    const dailyTask = await this.dailyTasksRepository.updateDailyTasks(
      dto,
      user.id,
    );
    if (!dailyTask) throw new UnauthorizedException();

    return {
      status: 'success',
      data: {
        id: dailyTask.id,
        status: dailyTask.status,
        completedAt: dailyTask.completed_at,
      },
      meta: null,
    };
  }

  async updateCompletionStatus(dto: UpdateDailyTaskDto, user: ValidateUser) {
    const dailyTask = await this.dailyTasksRepository.findDailyTaskForUser(
      dto.dailyTaskId,
      user.id,
    );
    if (!dailyTask) throw new UnauthorizedException();

    if (dailyTask.status === dto.status) {
      throw new BadRequestException(
        'Daily task already has the requested status',
      );
    }

    const completesPendingTask =
      dailyTask.status === 'PENDING' &&
      dto.status === 'COMPLETED' &&
      typeof dto.completedAt === 'string' &&
      !Number.isNaN(Date.parse(dto.completedAt));
    const restoresCompletedTask =
      dailyTask.status === 'COMPLETED' &&
      dto.status === 'PENDING' &&
      dto.completedAt === null;

    if (!completesPendingTask && !restoresCompletedTask) {
      throw new BadRequestException('Unsupported daily task status transition');
    }

    return this.updateDailyTasks(dto, user);
  }

  async carryForwardDailyTask(
    dto: CarryForwardDailyTaskDto,
    user: ValidateUser,
  ) {
    const dailyTask = await this.dailyTasksRepository.findDailyTaskForUser(
      dto.dailyTaskId,
      user.id,
    );
    if (!dailyTask) throw new UnauthorizedException();

    const targetDate = new Date(`${dto.taskDate}T00:00:00.000Z`);
    if (dailyTask.task_date.getTime() === targetDate.getTime()) {
      return {
        status: 'success',
        data: { id: dailyTask.id, taskDate: dailyTask.task_date, status: dailyTask.status },
        meta: null,
      };
    }
    if (dailyTask.status !== 'PENDING' || dailyTask.task_date >= targetDate) {
      throw new BadRequestException('Only pending overdue tasks can be carried forward');
    }

    try {
      const moved = await this.dailyTasksRepository.updateDailyTasks(
        { dailyTaskId: dto.dailyTaskId, status: 'PENDING', completedAt: null },
        user.id,
        { expectedStatus: 'PENDING', beforeTaskDate: targetDate, taskDate: targetDate },
      );
      if (!moved) throw new UnauthorizedException();
      return {
        status: 'success',
        data: { id: moved.id, taskDate: moved.task_date, status: moved.status },
        meta: null,
      };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new BadRequestException('A task for that date already exists');
      }
      throw error;
    }
  }
}
