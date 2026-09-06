import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuardianNestedDto {
  @IsString()
  @IsNotEmpty({ message: 'Guardian first name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Guardian last name is required' })
  lastName: string;

  @IsString()
  @IsIn(['FATHER', 'MOTHER', 'GUARDIAN'], { message: 'Relationship must be FATHER, MOTHER, or GUARDIAN' })
  relationship: string;

  @IsString()
  @IsNotEmpty({ message: 'Guardian phone is required' })
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class EnrollmentNestedDto {
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Class ID is required for enrollment' })
  classId: string;

  @IsString()
  @IsNotEmpty({ message: 'Section ID is required for enrollment' })
  sectionId: string;

  @IsOptional()
  rollNumber?: number;
}

export class CreateStudentDto {
  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsDateString({}, { message: 'Date of birth must be a valid ISO date' })
  dateOfBirth: string;

  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender must be MALE, FEMALE, or OTHER' })
  gender: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @IsOptional()
  @IsString()
  previousSchool?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianNestedDto)
  guardian?: GuardianNestedDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EnrollmentNestedDto)
  enrollment?: EnrollmentNestedDto;
}
