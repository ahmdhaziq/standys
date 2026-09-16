import { IsDateString, IsNumber, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CarryForwardDailyTaskDto {
  @Type(() => Number)
  @IsNumber()
  dailyTaskId!: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'taskDate must use YYYY-MM-DD format',
  })
  @IsDateString({}, { message: 'taskDate must be a valid date' })
  taskDate!: string;
}
