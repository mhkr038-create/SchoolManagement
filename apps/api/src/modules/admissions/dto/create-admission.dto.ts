import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdmissionDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  dateOfBirth: string;

  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender: string;

  @IsString()
  @IsNotEmpty({ message: 'Applying class is required' })
  applyingForClassId: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Parent name is required' })
  parentName: string;

  @IsString()
  @IsNotEmpty({ message: 'Parent phone is required' })
  parentPhone: string;

  @IsOptional()
  @IsString()
  parentEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  previousSchool?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
