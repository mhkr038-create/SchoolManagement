import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeeCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
