import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional } from 'class-validator';

export class UpdateDailyTaskDto {
  @Type(() => Number)
  @IsNumber()
  dailyTaskId!: number;

  @IsIn(['PENDING', 'COMPLETED'])
  status!: 'PENDING' | 'COMPLETED';

  @IsOptional()
  @IsDateString()
  completedAt!: string | null;
}
