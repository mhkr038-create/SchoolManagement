import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class EnrollStudentDto {
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Class ID is required' })
  classId: string;

  @IsString()
  @IsNotEmpty({ message: 'Section ID is required' })
  sectionId: string;

  @IsOptional()
  @IsNumber()
  rollNumber?: number;
}
