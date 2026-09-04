import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class NewDailyTaskDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  taskId!: number | null;

  @IsString()
  @MinLength(10)
  title!: string;

  @IsString()
  @MinLength(10)
  @IsOptional()
  description!: string;
}
