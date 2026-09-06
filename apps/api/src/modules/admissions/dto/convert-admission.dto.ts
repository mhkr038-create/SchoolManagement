import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ConvertAdmissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Class ID is required' })
  classId: string;

  @IsString()
  @IsNotEmpty({ message: 'Section ID is required' })
  sectionId: string;

  @IsOptional()
  @IsNumber()
  rollNumber?: number;

  @IsOptional()
  @IsString()
  academicYearId?: string;
}
