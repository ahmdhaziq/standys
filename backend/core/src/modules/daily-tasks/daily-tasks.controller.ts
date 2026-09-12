import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DailyTasksQueryDto } from './dto/daily-tasks-query.dto';
import { NewDailyTaskDto } from './dto/new-daily-task.dto';
import { ValidateUser } from '../auth/types/validate';
import { DailyTasksService } from './daily-tasks.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: ValidateUser;
}

@Controller('daily-tasks')
export class DailyTasksController {
  constructor(private readonly dailyTasksService: DailyTasksService) {}
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createDailyTask(
    @Body() dto: NewDailyTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.dailyTasksService.createDailyTask(dto, req.user);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getDailyTasks(
    @Req() req: AuthenticatedRequest,
    @Query() query: DailyTasksQueryDto,
  ) {
    return this.dailyTasksService.getDailyTasks(req.user, query.taskDate);
  }
}
