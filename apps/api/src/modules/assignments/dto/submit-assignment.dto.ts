import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  assignmentId: string;

  @IsString()
  @IsOptional()
  submissionText?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}