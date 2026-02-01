import { 
  IsString, 
  IsNumber, 
  Min, 
  IsNotEmpty,
  IsOptional,
  IsDateString
} from 'class-validator';
import { 
  ApiProperty, 
  ApiPropertyOptional 
} from '@nestjs/swagger';

export class CreatePurchaseDto {
  @ApiProperty({
    description: 'Product ID reference',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Supplier name',
    example: 'Global Coffee Suppliers Ltd.'
  })
  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @ApiProperty({
    description: 'Quantity purchased',
    example: 50,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Purchase price per unit',
    example: 25.00,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Purchase date',
    example: '2026-02-01T09:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2026-001'
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Bulk purchase discount applied'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}