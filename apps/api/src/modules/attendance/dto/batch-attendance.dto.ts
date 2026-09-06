import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchAttendanceItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @IsString()
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED_LEAVE'], {
    message: 'Status must be PRESENT, ABSENT, LATE, HALF_DAY, or EXCUSED_LEAVE'
  })
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BatchAttendanceDto {
  @IsString()
  @IsNotEmpty({ message: 'Class ID is required' })
  classId: string;

  @IsString()
  @IsNotEmpty({ message: 'Section ID is required' })
  sectionId: string;

  @IsDateString({}, { message: 'Date must be a valid ISO date (YYYY-MM-DD)' })
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAttendanceItemDto)
  records: BatchAttendanceItemDto[];
}
