import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDailyTaskDto {
  @IsNumber()
  taskId!: number;

  @IsNumber()
  userId!: number;

  @IsDateString()
  taskDate!: string;

  @IsString()
  status!: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
