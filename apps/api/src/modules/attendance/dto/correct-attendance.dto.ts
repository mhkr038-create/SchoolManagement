import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CorrectAttendanceDto {
  @IsString()
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED_LEAVE'], {
    message: 'Status must be PRESENT, ABSENT, LATE, HALF_DAY, or EXCUSED_LEAVE'
  })
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
