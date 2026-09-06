import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchMarkItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Student ID is required' })
  studentId: string;

  @IsOptional()
  @IsNumber({}, { message: 'Marks obtained must be a number' })
  @Min(0, { message: 'Marks cannot be negative' })
  marksObtained?: number | null;

  @IsBoolean({ message: 'isAbsent must be a boolean' })
  isAbsent: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BatchMarkEntryDto {
  @IsString()
  @IsNotEmpty({ message: 'Exam Schedule ID is required' })
  examScheduleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchMarkItemDto)
  entries: BatchMarkItemDto[];
}
