import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDailyTaskDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  taskId!: number | null;

  @IsDateString()
  taskDate!: string;

  @IsString()
  status!: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
