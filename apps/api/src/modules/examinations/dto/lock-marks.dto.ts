import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class LockMarksDto {
  @IsString()
  @IsNotEmpty({ message: 'Exam Schedule ID is required' })
  examScheduleId: string;

  @IsBoolean({ message: 'isLocked must be a boolean' })
  isLocked: boolean;
}
