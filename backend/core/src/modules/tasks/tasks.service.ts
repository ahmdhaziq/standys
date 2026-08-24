import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDTO } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async createTask(createTaskDto: CreateTaskDto) {
    return this.tasksRepository.createTask(createTaskDto);
  }

  async getTaskById(id: number) {
    return this.tasksRepository.getTaskById(id);
  }

  async getTasksByUserId(userId: number) {
    return this.tasksRepository.getTasksByUserId(userId);
  }

  async updateTask(id: number, data: UpdateTaskDTO) {
    const task = await this.tasksRepository.getTaskById(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }
    return this.tasksRepository.updateTask(task.id, data);
  }
}
