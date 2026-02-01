import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type SaleDocument = Sale & Document;

@Schema({ timestamps: true })
export class Sale {
  @ApiProperty({
    description: 'MongoDB auto-generated ID',
    example: '507f1f77bcf86cd799439012'
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'Reference to Product ID',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @ApiProperty({
    description: 'Customer name',
    example: 'Mohin Uddin'
  })
  @Prop({ required: true, trim: true })
  customerName: string;

  @ApiProperty({
    description: 'Quantity sold',
    example: 5,
    minimum: 1
  })
  @Prop({ required: true, min: 1 })
  quantity: number;

  @ApiProperty({
    description: 'Sale price per unit',
    example: 35.99,
    minimum: 0
  })
  @Prop({ required: true, min: 0 })
  salePrice: number;

  @ApiProperty({
    description: 'Total sale amount (quantity * salePrice)',
    example: 179.95,
    minimum: 0
  })
  @Prop({ required: true, min: 0, default: 0 })
  total: number;

  @ApiProperty({
    description: 'Purchase price per unit (for profit calculation)',
    example: 25.00,
    minimum: 0
  })
  @Prop({ required: true, min: 0 })
  purchasePrice: number;

  @ApiProperty({
    description: 'Profit amount (salePrice - purchasePrice) * quantity',
    example: 54.95,
    minimum: 0
  })
  @Prop({ default: 0, min: 0 })
  profit: number;

  @ApiProperty({
    description: 'Due amount (if payment is pending)',
    example: 0,
    minimum: 0
  })
  @Prop({ default: 0, min: 0 })
  due: number;

  @ApiPropertyOptional({
    description: 'Sale date',
    example: '2026-02-01T10:00:00.000Z'
  })
  @Prop({ default: Date.now })
  date: Date;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Bulk order discount applied'
  })
  @Prop()
  notes?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-02-01T10:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-02-01T10:00:00.000Z'
  })
  updatedAt: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);