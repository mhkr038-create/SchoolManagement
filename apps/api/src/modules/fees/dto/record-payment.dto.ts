import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}
