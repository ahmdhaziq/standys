import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NewDailyTaskDto } from './dto/new-daily-task.dto';
import { ValidateUser } from '../auth/types/validate';
import { DailyTasksService } from './daily-tasks.service';

@Controller('daily-tasks')
export class DailyTasksController {
  constructor(private readonly dailyTasksService: DailyTasksService) {}
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createDailyTask(@Body() dto: NewDailyTaskDto, @Request() req: any) {
    return await this.dailyTasksService.createDailyTask(dto, req.user);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getDailyTasks(
    @Request() req: any,
    @Query('taskDate') taskDate: string,
  ) {
    console.log('taskDate received:', taskDate);
    const user: ValidateUser = req.user;
    return await this.dailyTasksService.getDailyTasks(user.id, taskDate);
  }
}
