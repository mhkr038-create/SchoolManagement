import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateInvoicesDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsNotEmpty()
  feeStructureId: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsOptional()
  studentIds?: string[];
}
