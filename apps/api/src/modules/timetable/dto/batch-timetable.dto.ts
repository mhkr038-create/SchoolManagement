import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTimetableEntryDto } from './create-timetable-entry.dto';

export class BatchTimetableDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetableEntryDto)
  entries: CreateTimetableEntryDto[];
}