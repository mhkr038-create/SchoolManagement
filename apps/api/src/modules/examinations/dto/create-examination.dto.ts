import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';

export class CreateExaminationDto {
  @IsString()
  @IsNotEmpty({ message: 'Academic Year ID is required' })
  academicYearId: string;

  @IsString()
  @IsNotEmpty({ message: 'Examination name is required' })
  name: string;

  @IsDateString({}, { message: 'Start date must be a valid ISO date' })
  startDate: string;

  @IsDateString({}, { message: 'End date must be a valid ISO date' })
  endDate: string;

  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateExaminationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid ISO date' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO date' })
  endDate?: string;

  @IsOptional()
  @IsString()
  termId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
