import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class LockAttendanceDto {
  @IsString()
  @IsNotEmpty({ message: 'Class ID is required' })
  classId: string;

  @IsString()
  @IsNotEmpty({ message: 'Section ID is required' })
  sectionId: string;

  @IsDateString({}, { message: 'Date must be a valid ISO date (YYYY-MM-DD)' })
  date: string;
}
