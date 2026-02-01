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
import { Types } from 'mongoose';

export class CreateSaleDto {
  @ApiProperty({
    description: 'Product ID reference',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'Mohin Uddin'
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    description: 'Quantity sold',
    example: 5,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Sale price per unit',
    example: 35.99,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty({
    description: 'Purchase price per unit (for profit calculation)',
    example: 25.00,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiPropertyOptional({
    description: 'Due amount (if payment is pending)',
    example: 0,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  due?: number;

  @ApiPropertyOptional({
    description: 'Sale date',
    example: '2026-02-01T10:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Bulk order discount applied'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}