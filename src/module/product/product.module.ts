import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { Purchase, PurchaseSchema } from './schemas/purchase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}