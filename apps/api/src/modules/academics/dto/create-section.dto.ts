import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty({ message: 'Section name is required' })
  name: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;
}
