import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGradeScaleItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Grade name is required (e.g. A+, A)' })
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage: number;

  @IsOptional()
  @IsNumber()
  gradePoint?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateGradingSystemDto {
  @IsString()
  @IsNotEmpty({ message: 'Grading system name is required' })
  name: string;

  @IsString()
  @IsIn(['PERCENTAGE', 'GPA'], { message: 'Type must be PERCENTAGE or GPA' })
  type: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGradeScaleItemDto)
  scales: CreateGradeScaleItemDto[];
}
