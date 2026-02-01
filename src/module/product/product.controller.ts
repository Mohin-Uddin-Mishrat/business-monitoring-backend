import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - SKU already exists' })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  async findAll(
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number
  ) {
    return this.productService.findAllProducts(page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOneProduct(id);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get a product by SKU' })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySku(@Param('sku') sku: string) {
    return this.productService.findBySku(sku);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string) {
    return this.productService.removeProduct(id);
  }

  @Post('sales')
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createSale(@Body() createSaleDto: CreateSaleDto) {
    return this.productService.createSale(createSaleDto);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get all sales with pagination' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filter by product ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  async findAllSales(
    @Query('productId') productId?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number
  ) {
    return this.productService.findAllSales(productId, page || 1, limit || 10);
  }

  @Get('sales/report')
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format)', example: '2026-01-01T00:00:00.000Z' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format)', example: '2026-02-01T23:59:59.999Z' })
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.productService.getSalesReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Post('purchases')
  @ApiOperation({ summary: 'Create a new purchase' })
  @ApiResponse({ status: 201, description: 'Purchase created successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createPurchase(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.productService.createPurchase(createPurchaseDto);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Get all purchases with pagination' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filter by product ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  async findAllPurchases(
    @Query('productId') productId?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('limit', ParseIntPipe) limit?: number
  ) {
    return this.productService.findAllPurchases(productId, page || 1, limit || 10);
  }

  @Get('inventory/report')
  @ApiOperation({ summary: 'Get inventory report' })
  @ApiResponse({ status: 200, description: 'Inventory report retrieved successfully' })
  async getInventoryReport() {
    return this.productService.getInventoryReport();
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductStats(@Param('id') id: string) {
    return this.productService.getProductStats(id);
  }
}