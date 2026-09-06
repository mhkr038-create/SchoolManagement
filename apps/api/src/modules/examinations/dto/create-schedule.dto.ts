import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min
} from 'class-validator';

export class CreateExamScheduleDto {
  @IsString()
  @IsNotEmpty({ message: 'Class ID is required' })
  classId: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject ID is required' })
  subjectId: string;

  @IsDateString({}, { message: 'Exam date must be a valid ISO date' })
  examDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Start time is required (e.g. 09:30 AM)' })
  startTime: string;

  @IsString()
  @IsNotEmpty({ message: 'End time is required (e.g. 12:30 PM)' })
  endTime: string;

  @IsNumber({}, { message: 'Maximum marks must be a number' })
  @IsPositive({ message: 'Maximum marks must be greater than 0' })
  maxMarks: number;

  @IsNumber({}, { message: 'Passing marks must be a number' })
  @Min(0, { message: 'Passing marks cannot be negative' })
  passingMarks: number;
}
