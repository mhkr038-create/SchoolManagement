import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FeeStructureItemDto {
  @IsUUID()
  @IsNotEmpty()
  feeCategoryId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class CreateFeeStructureDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeStructureItemDto)
  items: FeeStructureItemDto[];
}
