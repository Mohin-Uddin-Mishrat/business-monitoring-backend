import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type PurchaseDocument = Purchase & Document;

@Schema({ timestamps: true })
export class Purchase {
  @ApiProperty({
    description: 'MongoDB auto-generated ID',
    example: '507f1f77bcf86cd799439013'
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'Reference to Product ID',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @ApiProperty({
    description: 'Supplier name',
    example: 'Global Coffee Suppliers Ltd.'
  })
  @Prop({ required: true, trim: true })
  supplierName: string;

  @ApiProperty({
    description: 'Quantity purchased',
    example: 50,
    minimum: 1
  })
  @Prop({ required: true, min: 1 })
  quantity: number;

  @ApiProperty({
    description: 'Purchase price per unit',
    example: 25.00,
    minimum: 0
  })
  @Prop({ required: true, min: 0 })
  price: number;

  @ApiProperty({
    description: 'Total purchase cost (quantity * price)',
    example: 1250.00,
    minimum: 0
  })
  @Prop({ required: true, min: 0, default: 0 })
  total: number;

  @ApiPropertyOptional({
    description: 'Purchase date',
    example: '2026-02-01T09:00:00.000Z'
  })
  @Prop({ default: Date.now })
  date: Date;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2026-001'
  })
  @Prop()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Bulk purchase discount applied'
  })
  @Prop()
  notes?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-02-01T09:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-02-01T09:00:00.000Z'
  })
  updatedAt: Date;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);