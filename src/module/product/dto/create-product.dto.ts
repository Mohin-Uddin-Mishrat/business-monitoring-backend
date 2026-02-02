import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  Min, 
  IsUrl,
  IsNotEmpty 
} from 'class-validator';
import { 
  ApiProperty, 
  ApiPropertyOptional, 
  PartialType
} from '@nestjs/swagger';

export class ProductCreateDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Premium Coffee Beans'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (unique identifier)',
    example: 'SKU-12345'
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'Available quantity in stock',
    example: 100,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 29.99,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Premium Arabica coffee beans, 500g pack'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Beverages'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/product.jpg',
    format: 'uri'
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}



export class UpdateProductDto extends PartialType(ProductCreateDto) {}