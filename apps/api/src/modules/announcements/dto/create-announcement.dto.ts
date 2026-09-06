import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS', 'CLASS'])
  targetAudience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS';

  @IsUUID()
  @IsOptional()
  targetClassId?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}