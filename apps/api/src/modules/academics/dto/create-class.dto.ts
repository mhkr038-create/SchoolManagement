import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty({ message: 'Class name is required' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
