import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @ApiProperty({
    description: 'MongoDB auto-generated ID',
    example: '507f1f77bcf86cd799439011'
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'Product name',
    example: 'Premium Coffee Beans'
  })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (unique identifier)',
    example: 'SKU-12345'
  })
  @Prop({ required: true, unique: true, trim: true })
  sku: string;

  @ApiProperty({
    description: 'Available quantity in stock',
    example: 100,
    minimum: 0
  })
  @Prop({ required: true, default: 0, min: 0 })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit',
    example: 29.99,
    minimum: 0
  })
  @Prop({ required: true, min: 0 })
  price: number;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Premium Arabica coffee beans, 500g pack'
  })
  @Prop()
  description?: string;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Beverages'
  })
  @Prop()
  category?: string;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/product.jpg',
    format: 'uri'
  })
  @Prop()
  imageUrl?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-02-01T10:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-02-01T12:00:00.000Z'
  })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);