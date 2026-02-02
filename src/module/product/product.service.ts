import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';
import { ProductCreateDto } from './dto/create-product.dto';
import { SaleCreateDto } from './dto/create-sale.dto';
import { PurchaseCreateDto } from './dto/create-purchase.dto';
import moment from 'moment';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
  ) {}

  // --- CREATE PRODUCT ---
  async createProduct(dto: ProductCreateDto) {
    const { name, sku, quantity, price } = dto;

    if (!name || !sku || quantity == null || price == null) {
      throw new BadRequestException('Invalid credentials');
    }

    const existing = await this.productModel.findOne({ sku });
    if (existing) {
      throw new BadRequestException('SKU already exists');
    }

    const product = await this.productModel.create({
      name,
      sku,
      quantity,
      price,
    });

    return {
      product,
      message: 'Product created successfully',
    };
  }

  // --- CREATE PURCHASE ---
  async createPurchase(dto: PurchaseCreateDto) {
    const { supplierName, productId, quantity, price } = dto;

    if (!supplierName || !productId || quantity <= 0 || price <= 0) {
      throw new BadRequestException('Invalid credentials');
    }

    // Validate ObjectId
    if (!this.isValidObjectId(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const total = quantity * price;

    // Update product stock
    await this.productModel.findByIdAndUpdate(productId, {
      $inc: { quantity: quantity },
    });

    // Create purchase record
    const purchase = await this.purchaseModel.create({
      supplierName,
      productId,
      quantity,
      price,
      total,
    });

    return {
      purchase,
      message: 'Purchase created successfully, and product stock updated',
    };
  }

  // --- CREATE SALE ---
  async createSale(dto: SaleCreateDto) {
    const { productId, customerName, quantity, salePrice, due, purchasePrice } =
      dto;

    if (
      !productId ||
      !customerName ||
      quantity <= 0 ||
      salePrice <= 0 ||
      purchasePrice == null ||
      due == null
    ) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!this.isValidObjectId(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.quantity < quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    const total = quantity * salePrice;
    const profit = total - purchasePrice * quantity;

    // Deduct stock
    await this.productModel.findByIdAndUpdate(productId, {
      $inc: { quantity: -quantity },
    });

    const sale = await this.saleModel.create({
      productId,
      customerName,
      quantity,
      salePrice,
      total,
      profit,
      due,
      purchasePrice,
    });

    return {
      sale,
      message: 'Sale created successfully, and product stock updated',
    };
  }

  // --- GENERATE REPORT ---
  async generateReport(startDate: string, endDate: string, productId?: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    if (start > end) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    // Normalize end date to include full day
    end.setHours(23, 59, 59, 999);

    const matchFilter: any = {
      date: { $gte: start, $lte: end },
    };

    if (productId && this.isValidObjectId(productId)) {
      matchFilter.productId = productId;
    } else if (productId) {
      throw new BadRequestException('Invalid product ID');
    }

    // Aggregation for sales & purchases totals
    const [salesAgg, purchasesAgg] = await Promise.all([
      this.saleModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalSalesMoney: { $sum: '$total' },
            totalProfit: { $sum: '$profit' },
            totalDues: { $sum: '$due' },
            totalSaleQuantity: { $sum: '$quantity' },
          },
        },
      ]),
      this.purchaseModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalPurchasesMoney: { $sum: '$total' },
            totalPurchaseQuantity: { $sum: '$quantity' },
          },
        },
      ]),
    ]);

    const saleSummary = salesAgg[0] || {};
    const purchaseSummary = purchasesAgg[0] || {};

    // Daily data for chart
    const dailySales = await this.saleModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          quantity: { $sum: '$quantity' },
        },
      },
    ]);

    const dailyPurchases = await this.purchaseModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          quantity: { $sum: '$quantity' },
        },
      },
    ]);

    // Build full date range
    const dates: string[] = [];
    const salesData: number[] = [];
    const purchasesData: number[] = [];

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dates.push(dateStr);

      const saleDay = dailySales.find((d) => d._id === dateStr);
      const purchaseDay = dailyPurchases.find((d) => d._id === dateStr);

      salesData.push(saleDay?.quantity || 0);
      purchasesData.push(purchaseDay?.quantity || 0);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      data: {
        dates,
        salesData,
        purchasesData,
        totalSalesMoney: saleSummary.totalSalesMoney || 0,
        totalSaleQuantity: saleSummary.totalSaleQuantity || 0,
        totalPurchasesMoney: purchaseSummary.totalPurchasesMoney || 0,
        totalPurchaseQuantity: purchaseSummary.totalPurchaseQuantity || 0,
        totalProfit: saleSummary.totalProfit || 0,
        totalDues: saleSummary.totalDues || 0,
      },
      message: 'Report generated successfully',
    };
  }

  // --- GET SALES WITH PAGINATION ---
  async getSalesWithPagination(
    startDate?: string,
    endDate?: string,
    productId?: string,
    customerName?: string,
    page: any = 1,
    pageSize: any = 10,
  ) {
    const now = moment();
    const start = startDate
      ? new Date(startDate)
      : now.clone().startOf('month').toDate();
    const end = endDate
      ? new Date(endDate)
      : now.clone().endOf('month').toDate();

    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Number(pageSize) || 10);
    const skip = (pageNum - 1) * limit;

    const filter: any = {
      date: { $gte: start, $lte: end },
    };

    if (productId) {
      if (!this.isValidObjectId(productId)) {
        throw new BadRequestException('Invalid product ID');
      }
      filter.productId = productId;
    }

    if (customerName?.trim()) {
      filter.customerName = { $regex: customerName.trim(), $options: 'i' };
    }

    const [sales, totalSalesCount, aggregates] = await Promise.all([
      this.saleModel.find(filter).skip(skip).limit(limit).sort({ date: -1 }),
      this.saleModel.countDocuments(filter),
      this.saleModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalProfit: { $sum: '$profit' },
            totalDue: { $sum: '$due' },
            totalAmount: { $sum: '$total' },
          },
        },
      ]),
    ]);

    const agg = aggregates[0] || {};

    return {
      sales,
      totalSalesCount,
      page: pageNum,
      totalPages: Math.ceil(totalSalesCount / limit),
      salesData: {
        quantity: agg.totalQuantity || 0,
        profit: agg.totalProfit || 0,
        due: agg.totalDue || 0,
        total: agg.totalAmount || 0,
      },
    };
  }

  // --- GET PURCHASES WITH PAGINATION ---
  async getPurchasesWithPagination(
    startDate?: string,
    endDate?: string,
    productId?: string,
    supplierName?: string,
    page: any = 1,
    pageSize: any = 10,
  ) {
    const now = moment();
    const start = startDate
      ? new Date(startDate)
      : now.clone().startOf('month').toDate();
    const end = endDate
      ? new Date(endDate)
      : now.clone().endOf('month').toDate();

    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Number(pageSize) || 10);
    const skip = (pageNum - 1) * limit;

    const filter: any = {
      date: { $gte: start, $lte: end },
    };

    if (productId) {
      if (!this.isValidObjectId(productId)) {
        throw new BadRequestException('Invalid product ID');
      }
      filter.productId = productId;
    }

    if (supplierName?.trim()) {
      filter.supplierName = { $regex: supplierName.trim(), $options: 'i' };
    }

    const [purchases, totalPurchasesCount, aggregates] = await Promise.all([
      this.purchaseModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ date: -1 }),
      this.purchaseModel.countDocuments(filter),
      this.purchaseModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalAmount: { $sum: '$total' },
          },
        },
      ]),
    ]);

    const agg = aggregates[0] || {};

    return {
      purchases,
      totalPurchasesCount,
      page: pageNum,
      totalPages: Math.ceil(totalPurchasesCount / limit),
      purchasesData: {
        quantity: agg.totalQuantity || 0,
        total: agg.totalAmount || 0,
      },
    };
  }

  // --- GET PRODUCT DATA IN DATE RANGE ---
  async getProductDataInRange(
    productId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Validate date range
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    // Validate ObjectId
    if (!this.isValidObjectId(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    // Normalize end date to include full day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Run parallel aggregations for sales and purchases
    const [salesAgg, purchasesAgg] = await Promise.all([
      // Aggregate sales data
      this.saleModel.aggregate([
        {
          $match: {
            productId: productId,
            date: { $gte: startDate, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalSaleQuantity: { $sum: '$quantity' },
            totalProfit: { $sum: '$profit' },
            totalDues: { $sum: '$due' },
          },
        },
      ]),
      // Aggregate purchases data
      this.purchaseModel.aggregate([
        {
          $match: {
            productId: productId,
            date: { $gte: startDate, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: '$total' },
            totalPurchaseQuantity: { $sum: '$quantity' },
          },
        },
      ]),
    ]);

    const saleSummary = salesAgg[0] || {};
    const purchaseSummary = purchasesAgg[0] || {};

    return {
      totalSales: saleSummary.totalSales || 0,
      totalSaleQuantity: saleSummary.totalSaleQuantity || 0,
      totalPurchaseQuantity: purchaseSummary.totalPurchaseQuantity || 0,
      totalProfit: saleSummary.totalProfit || 0,
      totalDues: saleSummary.totalDues || 0,
      totalPurchases: purchaseSummary.totalPurchases || 0,
    };
  }
  // --- GET DUES WITH PAGINATION ---
  async getDueWithPagination(
    startDate?: string,
    endDate?: string,
    productId?: string,
    page: any = 1,
    pageSize: any = 10,
  ) {
    const now = moment();
    const start = startDate
      ? new Date(startDate)
      : now.clone().startOf('month').toDate();
    const end = endDate
      ? new Date(endDate)
      : now.clone().endOf('month').toDate();

    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limit = Math.max(1, Number(pageSize) || 10);
    const skip = (pageNum - 1) * limit;

    const filter: any = {
      date: { $gte: start, $lte: end },
      due: { $gt: 0 },
    };

    if (productId) {
      if (!this.isValidObjectId(productId)) {
        throw new BadRequestException('Invalid product ID');
      }
      filter.productId = productId;
    }

    const [sales, totalDueCount] = await Promise.all([
      this.saleModel.find(filter).skip(skip).limit(limit).sort({ date: -1 }),
      this.saleModel.countDocuments(filter),
    ]);

    return {
      sales,
      totalDueCount,
      page: pageNum,
      totalPages: Math.ceil(totalDueCount / limit),
    };
  }

  // --- HELPER: Validate ObjectId ---
  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}
