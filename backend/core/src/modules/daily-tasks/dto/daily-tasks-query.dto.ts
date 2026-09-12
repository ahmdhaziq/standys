import { IsDateString, Matches } from 'class-validator';

export class DailyTasksQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'taskDate must use YYYY-MM-DD format',
  })
  @IsDateString({}, { message: 'taskDate must be a valid date' })
  taskDate!: string;
}
