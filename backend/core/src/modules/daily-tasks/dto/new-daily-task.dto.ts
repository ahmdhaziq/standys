import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class NewDailyTaskDto {
  @IsNumber()
  @IsOptional()
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

  @IsString()
  @MinLength(10)
  title!: string;

  @IsString()
  @MinLength(10)
  @IsOptional()
  description!: string;
}
