import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import {  ProductCreateDto, UpdateProductDto } from './dto/create-product.dto';
import {  SaleCreateDto } from './dto/create-sale.dto';
import {  PurchaseCreateDto } from './dto/create-purchase.dto';
import sendResponse from 'src/utils/sendResponse';
import type { Request, Response } from 'express';
import moment from 'moment';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly ProductService: ProductService) {}
  @Post('create-product')
  @ApiOperation({ summary: 'Create  Product' })
  async createProduct(
    @Body() dto: ProductCreateDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.ProductService.createProduct(dto);
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: result.message,
      data: result.product,
    });
  }
  // create purchase
  @Post('create-purchase')
  @ApiOperation({ summary: 'Create  Product' })
  async createPurchase(
    @Body() dto: PurchaseCreateDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.ProductService.createPurchase(dto);
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: result.message,
      data: result.purchase,
    });
  }
  //create sale
  @Post('create-sale')
  @ApiOperation({ summary: 'Create  Product' })
  async createSale(
    @Body() dto: SaleCreateDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.ProductService.createSale(dto);
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: result.message,
      data: result.sale,
    });
  }
  // generate report for chart
  @Get('generate-report')
  @ApiOperation({ summary: 'Generate Product Report' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for the report',
    type: String,
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for the report',
    type: String,
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Product ID to filter the report by',
    type: String,
    example: 'b0e742f9-df07-4e12-b90d-4b45b34a5b60',
  })
  async generateReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('productId') productId: string, // Optional productId query
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      const now = moment();
      startDate = now.startOf('month').format('YYYY-MM-DD');
      endDate = now.endOf('month').format('YYYY-MM-DD');
    }

    // Use provided dates or fallback to default ones
    const start = startDate;
    const end = endDate;

    const result = await this.ProductService.generateReport(
      start,
      end,
      productId,
    ); // Pass productId to the service

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: result.message,
      data: result.data,
    });
  }
  // gnerate report for accounting
  @Get('generate-report-accounting')
  @ApiOperation({ summary: 'Generate Product Report' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for the report',
    type: String,
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for the report',
    type: String,
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Product ID to filter the report by',
    type: String,
    example: 'b0e742f9-df07-4e12-b90d-4b45b34a5b60',
  })
  async generateReportAcccount(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('productId') productId: string, // Optional productId query
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      const now = moment();
      // Set the start of the current month (first day of the month)
      startDate = now.startOf('month').format('YYYY-MM-DD');
      // Set the end of the current month (last day of the month)
      endDate = now.endOf('month').format('YYYY-MM-DD');
    }
    const result = await this.ProductService.getProductDataInRange(
      productId,
      new Date(startDate),
      new Date(endDate),
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Product report generated successfully',
      data: result,
    });
  }
  // get slase with pagination
  @Get('getSalesWithPagination')
  @ApiOperation({ summary: 'Generate Sales Report with Pagination' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for the report (default is the current year)',
    type: String,
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for the report (default is the current year)',
    type: String,
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Product ID to filter the sales by (optional)',
    type: String,
    example: 'b0e742f9-df07-4e12-b90d-4b45b34a5b60',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default is 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of results per page (default is 10)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'customerName',
    required: false,
    description: 'Search by customer name',
    type: String,
    example: 'alice',
  })
  async getSalesWithPagination(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string,
    @Query('customerName') customerName?: string,
    @Query('page') page = 1, // Default to page 1
    @Query('pageSize') pageSize = 10, // Default to 10 results per page
  ) {
    console.log(page, pageSize);
    const result = await this.ProductService.getSalesWithPagination(
      startDate,
      endDate,
      productId,
      customerName,
      page,
      pageSize,
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Sales report generated successfully',
      data: result,
    });
  }
  // get Purchase with pagination
  @Get('getPurchasesWithPagination')
  @ApiOperation({ summary: 'Generate Purchase Report with Pagination' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for the report (default is the current year)',
    type: String,
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for the report (default is the current year)',
    type: String,
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Product ID to filter the purchases by (optional)',
    type: String,
    example: 'b0e742f9-df07-4e12-b90d-4b45b34a5b60',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default is 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of results per page (default is 10)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'supplierName',
    required: false,
    description: 'supplierName',
    type: String,
    example: 'suppliarname',
  })
  async getPurchasesWithPagination(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string,
    @Query('supplierName') supplierName?: string,
    @Query('page') page = 1, // Default to page 1
    @Query('pageSize') pageSize = 10, // Default to 10 results per page
  ) {
    const result = await this.ProductService.getPurchasesWithPagination(
      startDate,
      endDate,
      productId,
      supplierName,
      page,
      pageSize,
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Purchase report generated successfully',
      data: result,
    });
  }
  // get slase with pagination
  @Get('getDueWithPagination')
  @ApiOperation({ summary: 'Generate Due Report with Pagination' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for the report (default is the current year)',
    type: String,
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for the report (default is the current year)',
    type: String,
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Product ID to filter the due report by (optional)',
    type: String,
    example: 'b0e742f9-df07-4e12-b90d-4b45b34a5b60',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default is 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of results per page (default is 10)',
    type: Number,
    example: 10,
  })
  async getDueWithPagination(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string,
    @Query('page') page = 1, // Default to page 1
    @Query('pageSize') pageSize = 10, // Default to 10 results per page
  ) {
    const result = await this.ProductService.getDueWithPagination(
      startDate,
      endDate,
      productId,
      page,
      pageSize,
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Due report generated successfully',
      data: result,
    });
  }
}
