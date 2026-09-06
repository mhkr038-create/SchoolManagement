import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxMarks?: number;

  @IsString()
  @IsOptional()
  fileAttachmentUrl?: string;
}