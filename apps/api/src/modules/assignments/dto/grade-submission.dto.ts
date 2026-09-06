import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GradeSubmissionDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  marksAwarded: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}