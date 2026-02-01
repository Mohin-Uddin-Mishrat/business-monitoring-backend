import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
  ) {}

  // Product Methods
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.productModel.findOne({ 
      sku: createProductDto.sku 
    });
    if (existingProduct) {
      throw new BadRequestException('SKU already exists');
    }

    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async findAllProducts(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments().exec(),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneProduct(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productModel.findOne({ sku }).exec();
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { 
        new: true,
        runValidators: true 
      })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return updatedProduct;
  }

  async removeProduct(id: string): Promise<Product> {
    const deletedProduct = await this.productModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete related sales and purchases
    await this.saleModel.updateMany(
      { productId: id },
      { $set: { deleted: true } }
    ).exec();

    await this.purchaseModel.updateMany(
      { productId: id },
      { $set: { deleted: true } }
    ).exec();

    return deletedProduct;
  }

  // Sale Methods
  async createSale(createSaleDto: CreateSaleDto): Promise<Sale> {
    // Verify product exists
    const product = await this.productModel.findById(createSaleDto.productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if sufficient quantity is available
    if (product.quantity < createSaleDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.quantity}, Requested: ${createSaleDto.quantity}`
      );
    }

    // Calculate total and profit
    const total = createSaleDto.quantity * createSaleDto.salePrice;
    const profit = createSaleDto.quantity * (createSaleDto.salePrice - createSaleDto.purchasePrice);

    const saleData = {
      ...createSaleDto,
      total,
      profit,
      productId: createSaleDto.productId,
    };

    const createdSale = new this.saleModel(saleData);
    const savedSale = await createdSale.save();

    // Update product quantity
    await this.productModel.findByIdAndUpdate(
      createSaleDto.productId,
      { $inc: { quantity: -createSaleDto.quantity } },
      { new: true }
    ).exec();

    return savedSale;
  }

  async findAllSales(
    productId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter = productId ? { productId } : {};

    const [sales, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .sort({ date: -1 })
        .populate('productId', 'name sku')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(filter).exec(),
    ]);

    return {
      data: sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSalesReport(startDate?: Date, endDate?: Date): Promise<any> {
    const matchStage: any = {};
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    const report = await this.saleModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalProfit: { $sum: '$profit' },
          totalDue: { $sum: '$due' },
          totalQuantity: { $sum: '$quantity' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]).exec();

    return report[0] || {
      totalSales: 0,
      totalProfit: 0,
      totalDue: 0,
      totalQuantity: 0,
      totalTransactions: 0
    };
  }

  // Purchase Methods
  async createPurchase(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // Verify product exists
    const product = await this.productModel.findById(createPurchaseDto.productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate total
    const total = createPurchaseDto.quantity * createPurchaseDto.price;

    const purchaseData = {
      ...createPurchaseDto,
      total,
      productId: createPurchaseDto.productId,
    };

    const createdPurchase = new this.purchaseModel(purchaseData);
    const savedPurchase = await createdPurchase.save();

    // Update product quantity and track purchase price
    await this.productModel.findByIdAndUpdate(
      createPurchaseDto.productId,
      { $inc: { quantity: createPurchaseDto.quantity } },
      { new: true }
    ).exec();

    return savedPurchase;
  }

  async findAllPurchases(
    productId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter = productId ? { productId } : {};

    const [purchases, total] = await Promise.all([
      this.purchaseModel
        .find(filter)
        .sort({ date: -1 })
        .populate('productId', 'name sku')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.purchaseModel.countDocuments(filter).exec(),
    ]);

    return {
      data: purchases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInventoryReport(): Promise<any> {
    const lowStockThreshold = 10;

    const [totalProducts, lowStockProducts, totalInventoryValue] = await Promise.all([
      this.productModel.countDocuments().exec(),
      this.productModel.find({ quantity: { $lt: lowStockThreshold } }).exec(),
      this.productModel.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
          }
        }
      ]).exec()
    ]);

    return {
      totalProducts,
      lowStockProducts: lowStockProducts.length,
      lowStockItems: lowStockProducts,
      totalInventoryValue: totalInventoryValue[0]?.totalValue || 0,
      lowStockThreshold
    };
  }

  async getProductStats(productId: string): Promise<any> {
    const [product, totalSales, totalPurchases] = await Promise.all([
      this.productModel.findById(productId).exec(),
      this.saleModel.aggregate([
        { $match: { productId: productId as any } },
        {
          $group: {
            _id: null,
            totalQuantitySold: { $sum: '$quantity' },
            totalRevenue: { $sum: '$total' },
            totalProfit: { $sum: '$profit' }
          }
        }
      ]).exec(),
      this.purchaseModel.aggregate([
        { $match: { productId: productId as any } },
        {
          $group: {
            _id: null,
            totalQuantityPurchased: { $sum: '$quantity' },
            totalCost: { $sum: '$total' }
          }
        }
      ]).exec()
    ]);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      product,
      sales: {
        totalQuantitySold: totalSales[0]?.totalQuantitySold || 0,
        totalRevenue: totalSales[0]?.totalRevenue || 0,
        totalProfit: totalSales[0]?.totalProfit || 0,
        totalTransactions: await this.saleModel.countDocuments({ productId }).exec()
      },
      purchases: {
        totalQuantityPurchased: totalPurchases[0]?.totalQuantityPurchased || 0,
        totalCost: totalPurchases[0]?.totalCost || 0,
        totalTransactions: await this.purchaseModel.countDocuments({ productId }).exec()
      }
    };
  }
}