import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Subject name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject code is required' })
  code: string;

  @IsIn(['THEORY', 'PRACTICAL', 'ACTIVITY'], { message: 'Type must be THEORY, PRACTICAL, or ACTIVITY' })
  type: string;
}
