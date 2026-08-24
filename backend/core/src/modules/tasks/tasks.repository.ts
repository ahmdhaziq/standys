import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(createTaskDto: CreateTaskDto) {
    return this.prisma.tasks.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        user_id: createTaskDto.userId,
        updated_at: new Date(),
      },
    });
  }

  async getTaskById(id: number) {
    return this.prisma.tasks.findUnique({
      where: { id: id },
    });
  }

  async getTasksByUserId(userId: number) {
    return this.prisma.tasks.findMany({
      where: { user_id: userId },
    });
  }

  async updateTask(id: number, data: UpdateTaskDto) {
    return this.prisma.tasks.update({
      where: { id: id },
      data: {
        title: data.title,
        description: data.description,
        updated_at: new Date(),
      },
    });
  }
}
