import { prisma } from '@/config/database';
import { cjDropshippingService, CJProduct } from './cjDropshippingService';
import { aliexpressService, AliExpressProduct } from './aliexpressService';
import { keywordService } from './keywordService';
import { logger } from '@/config/logger';

export interface ImportProductRequest {
  sourcePlatform: 'cj_dropshipping' | 'aliexpress';
  productIds: string[];
  destinationCountry: string;
  analyzeKeywordss?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  productIds: string[];
}

export class ProductImportService {
  /**
   * Import products from external platforms
   */
  async importProducts(request: ImportProductRequest): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      productIds: [],
    };

    try {
      if (request.sourcePlatform === 'cj_dropshipping') {
        result.productIds = request.productIds;
        
        for (const productId of request.productIds) {
          try {
            // Get product details from CJ Dropshipping
            const product = await cjDropshippingService.getProductDetails(productId);
            if (!product) {
              result.failed++;
              result.errors.push(`Product ${productId} not found`);
              continue;
            }

            // Get shipping info
            const shippingInfo = await cjDropshippingService.getShippingInfo(
              productId,
              request.destinationCountry
            );

            // Create product in database
            const createdProduct = await this.createProduct(product, shippingInfo);

            // Analyze keywords if requested
            if (request.analyzeKeywordss) {
              await this.analyzeProductKeywords(createdProduct.id, product.title);
            }

            result.imported++;
          } catch (error: any) {
            result.failed++;
            result.errors.push(`Failed to import product ${productId}: ${error.message}`);
            logger.error('Failed to import CJ Dropshipping product:', {
              productId,
              error: error.message,
            });
          }
        }
      } else if (request.sourcePlatform === 'aliexpress') {
        // AliExpress import logic would go here
        result.errors.push('AliExpress import not implemented yet');
      }

      result.success = result.imported > 0;
    } catch (error: any) {
      result.errors.push(`Import failed: ${error.message}`);
      logger.error('Product import failed:', error);
    }

    return result;
  }

  /**
   * Import CJ products by keyword
   */
  async importCJProductsByKeyword(
    keyword: string,
    limit: number = 50,
    destinationCountry: string = 'US',
    analyzeKeywordss: boolean = true
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      productIds: [],
    };

    try {
      // Use the new search and import method
      const searchResult = await cjDropshippingService.searchAndImportProducts(
        keyword,
        limit,
        destinationCountry
      );

      // The searchAndImportProducts method already handles the import logic
      // We just need to return the results in our expected format
      result.imported = searchResult.imported;
      result.failed = searchResult.failed;
      result.errors = searchResult.errors;
      result.success = searchResult.imported > 0;

      // For productIds, we'll need to get them from the search results
      // Since searchAndImportProducts doesn't return the actual product IDs,
      // we'll mark this as a limitation for now
      result.productIds = [];

    } catch (error: any) {
      result.errors.push(`Import failed: ${error.message}`);
      logger.error('CJ product import by keyword failed:', error);
    }

    return result;
  }

  /**
   * Create a product in the database
   */
  private async createProduct(
    product: CJProduct | AliExpressProduct,
    shippingInfo: any[]
  ) {
    return await prisma.product.create({
      data: {
        sourcePlatform: 'vendorName' in product && product.vendorName === 'CJ Dropshipping' ? 'cj_dropshipping' : 'aliexpress',
        sourceProductId: product.id,
        title: product.title,
        descriptionRaw: product.description,
        price: product.price || 0,
        currency: product.currency || 'USD',
        vendorName: 'vendorName' in product ? product.vendorName : 'AliExpress',
        categoryPath: product.categoryPath || [],
        images: product.images || [],
        shippingOptions: {
          create: shippingInfo.map(info => ({
            destinationCountry: info.destinationCountry,
            isShippable: info.isShippable,
            shippingCost: info.shippingCost,
            etaMinDays: info.etaMinDays,
            etaMaxDays: info.etaMaxDays,
            methodName: info.methodName,
          })),
        },
      },
    });
  }

  /**
   * Analyze keywords for a product
   */
  private async analyzeProductKeywords(productId: string, productTitle: string) {
    try {
      // Extract keywords from product title
      const keywords = this.extractKeywordsFromTitle(productTitle);
      
      // Analyze each keyword
      for (const keyword of keywords) {
        await keywordService.analyzeKeywords(keyword, 'US');
      }

      // Create keyword set for the product
      // Keyword analysis completed
    } catch (error: any) {
      logger.error('Failed to analyze product keywords:', {
        productId,
        productTitle,
        error: error.message,
      });
    }
  }

  /**
   * Extract keywords from product title
   */
  private extractKeywordsFromTitle(title: string): string[] {
    // Simple keyword extraction - in production, you'd want more sophisticated logic
    const words = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5); // Limit to 5 keywords

    return words;
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalImported: number;
    cjDropshippingImported: number;
    aliExpressImported: number;
    lastImportDate: Date | null;
  }> {
    const stats = await prisma.product.groupBy({
      by: ['sourcePlatform'],
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
    });

    const result = {
      totalImported: 0,
      cjDropshippingImported: 0,
      aliExpressImported: 0,
      lastImportDate: null as Date | null,
    };

    for (const stat of stats) {
      const count = stat._count.id;
      result.totalImported += count;

      if (stat.sourcePlatform === 'cj_dropshipping') {
        result.cjDropshippingImported = count;
      } else if (stat.sourcePlatform === 'aliexpress') {
        result.aliExpressImported = count;
      }

      if (stat._max.createdAt && (!result.lastImportDate || stat._max.createdAt > result.lastImportDate)) {
        result.lastImportDate = stat._max.createdAt;
      }
    }

    return result;
  }
}

export const productImportService = new ProductImportService();
