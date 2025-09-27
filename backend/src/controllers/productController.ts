import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { productImportService, ImportProductRequest } from '@/services/productImportService';
import { keywordService } from '@/services/keywordService';
import { cjDropshippingService } from '@/services/cjDropshippingService';
import { bulkAnalysisService, BulkAnalysisRequest } from '@/services/bulkAnalysisService';
import { logger } from '@/config/logger';
import { asyncHandler } from '@/middleware/errorHandler';

export const productController = {
  /**
   * Get all products with pagination and filters
   */
  getProducts: asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      sourcePlatform,
      country,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};

    if (search) {
      where.title = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    if (sourcePlatform) {
      where.sourcePlatform = sourcePlatform;
    }

    if (status) {
      const scoreRange = status === 'high' ? { gte: 70 } : 
                        status === 'medium' ? { gte: 40, lt: 70 } : 
                        { lt: 40 };
      where.productScores = {
        some: {
          oppScore: scoreRange,
        },
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          productScores: {
            include: {
              keywordSet: {
                include: {
                  keywords: {
                    take: 5,
                    orderBy: { score: 'desc' },
                  },
                },
              },
            },
          },
          shippingOptions: {
            where: country ? { destinationCountry: country as string } : {},
            take: 1,
          },
          _count: {
            select: {
              keywordSets: true,
              campaigns: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }),

  /**
   * Get product by ID
   */
  getProductById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productScores: {
          include: {
            keywordSet: {
              include: {
                keywords: {
                  orderBy: { score: 'desc' },
                },
              },
            },
          },
        },
        shippingOptions: {
          orderBy: { destinationCountry: 'asc' },
        },
        keywordSets: {
          include: {
            keywords: {
              orderBy: { score: 'desc' },
            },
          },
        },
        campaigns: {
          include: {
            keywordSet: {
              include: {
                keywords: {
                  take: 5,
                  orderBy: { score: 'desc' },
                },
              },
            },
          },
        },
        shopifyPages: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  }),

  /**
   * Import products from external sources
   */
  importProducts: asyncHandler(async (req: Request, res: Response) => {
    const importRequest: ImportProductRequest = req.body;

    // Validate request
    if (!importRequest.sourcePlatform || !importRequest.productIds?.length) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourcePlatform, productIds',
      });
    }

    const result = await productImportService.importProducts(importRequest);

    return res.json({
      success: result.success,
      data: result,
    });
  }),

  /**
   * Analyze keywords for a product
   */
  analyzeKeywords: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { country = 'US' } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    try {
      const analysis = await keywordService.analyzeKeywords(product.title, country);
      const scoredKeywords = keywordService.scoreKeywords(analysis.expandedKeywords);

      // Save analysis to database
      const keywordSet = await prisma.keywordSet.create({
        data: {
          productId: id,
          country,
          language: 'en',
          keywords: {
            create: scoredKeywords.map(k => ({
              term: k.keyword,
              avgMonthlySearches: k.metrics.avgMonthlySearches,
              competition: k.metrics.competition,
              cpcLow: k.metrics.cpcLow,
              cpcHigh: k.metrics.cpcHigh,
              score: k.score,
            })),
          },
        },
      });

      // Update product score
      const topKeywords = keywordService.getTopKeywords(scoredKeywords, 5);
      const avgScore = topKeywords.reduce((sum, k) => sum + k.score, 0) / topKeywords.length;

      await prisma.productScore.upsert({
        where: { productId: id },
        update: {
          keywordSetId: keywordSet.id,
          oppScore: avgScore,
          reason: `Based on ${topKeywords.length} top keywords`,
        },
        create: {
          productId: id,
          keywordSetId: keywordSet.id,
          oppScore: avgScore,
          reason: `Based on ${topKeywords.length} top keywords`,
        },
      });

      return res.json({
        success: true,
        data: {
          analysis,
          scoredKeywords: keywordService.getTopKeywords(scoredKeywords, 20),
          productScore: avgScore,
        },
      });

    } catch (error) {
      logger.error('Keyword analysis failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze keywords',
      });
    }
  }),

  /**
   * Delete product
   */
  deleteProduct: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  }),

  /**
   * Get product statistics
   */
  getProductStats: asyncHandler(async (req: Request, res: Response) => {
    const [
      totalProducts,
      analyzedProducts,
      highOpportunityProducts,
      activeCampaigns,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          productScores: {
            isNot: null,
          },
        },
      }),
      prisma.product.count({
        where: {
          AND: [
            {
              productScores: {
                isNot: null,
              },
            },
            {
              productScores: {
                oppScore: { gte: 70 },
              },
            },
          ],
        },
      }),
      prisma.campaign.count({
        where: {
          status: 'active',
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        totalProducts,
        analyzedProducts,
        highOpportunityProducts,
        activeCampaigns,
      },
    });
  }),

  /**
   * Import products from CJ Dropshipping by keyword
   */
  importCJProductsByKeyword: asyncHandler(async (req: Request, res: Response) => {
    const { keyword, limit = 50, destinationCountry = 'US', analyzeKeywords = true } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: keyword',
      });
    }

    const result = await productImportService.importCJProductsByKeyword(
      keyword,
      limit,
      destinationCountry,
      analyzeKeywords
    );

    return res.json({
      success: result.success,
      data: result,
    });
  }),

  /**
   * Search CJ Dropshipping products
   */
  searchCJProducts: asyncHandler(async (req: Request, res: Response) => {
    const { keyword, category, minPrice, maxPrice, page = 1, limit = 50 } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: keyword',
      });
    }

    try {
      const products = await cjDropshippingService.searchProducts({
        keyword: keyword as string,
        category: category as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      return res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: products.length,
          },
        },
      });
    } catch (error: any) {
      logger.error('CJ Dropshipping search failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to search CJ Dropshipping products',
      });
    }
  }),

  /**
   * Get CJ Dropshipping categories
   */
  getCJCategories: asyncHandler(async (req: Request, res: Response) => {
    try {
      const categories = await cjDropshippingService.getCategories();
      
      return res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Failed to get CJ Dropshipping categories:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get CJ Dropshipping categories',
      });
    }
  }),

  /**
   * Get trending products from CJ Dropshipping
   */
  getCJTrendingProducts: asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20 } = req.query;

    try {
      const products = await cjDropshippingService.getTrendingProducts(parseInt(limit as string));
      
      return res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get trending products from CJ Dropshipping:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get trending products',
      });
    }
  }),

  /**
   * Get best selling products from CJ Dropshipping
   */
  getCJBestSellingProducts: asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20, category } = req.query;

    try {
      const products = await cjDropshippingService.getBestSellingProducts(
        parseInt(limit as string),
        category as string
      );
      
      return res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get best selling products from CJ Dropshipping:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get best selling products',
      });
    }
  }),

  /**
   * Get featured products from CJ Dropshipping
   */
  getCJFeaturedProducts: asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20 } = req.query;

    try {
      const products = await cjDropshippingService.getFeaturedProducts(parseInt(limit as string));
      
      return res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get featured products from CJ Dropshipping:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get featured products',
      });
    }
  }),

  /**
   * Get products by category from CJ Dropshipping
   */
  getCJProductsByCategory: asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, limit = 20, sortType = 'sales' } = req.query;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: categoryId',
      });
    }

    try {
      const products = await cjDropshippingService.getProductsByCategory(
        categoryId as string,
        parseInt(limit as string),
        sortType as 'newest' | 'sales' | 'price'
      );
      
      return res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get products by category from CJ Dropshipping:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get products by category',
      });
    }
  }),

  /**
   * Generate intelligent keywords using OpenAI
   */
  generateIntelligentKeywords: asyncHandler(async (req: Request, res: Response) => {
    const { productTitle, productPrice, category } = req.body;

    if (!productTitle) {
      return res.status(400).json({
        success: false,
        error: 'Product title is required'
      });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    const prompt = `Analyze this product and generate the 3 most effective keywords for Google Ads targeting. Focus on buyer intent and commercial keywords that people would actually search for when looking to buy this product.

Product Title: "${productTitle}"
Price: "${productPrice || 'Not specified'}"
Category: "${category || 'Not specified'}"

Requirements:
1. Generate 3 keywords maximum
2. Focus on commercial intent (buying keywords)
3. Include relevant product attributes (color, style, material, etc.)
4. Consider seasonal trends if applicable
5. Use terms customers would actually search for
6. Prioritize keywords that would convert well for dropshipping

Format as a simple comma-separated list, no explanations needed.

Example format: "wireless bluetooth headphones, noise cancelling earbuds, premium audio headset"`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in e-commerce keyword research and Google Ads optimization. Generate high-converting commercial keywords for product listings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const keywords = data.choices[0].message.content
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0)
        .slice(0, 3);

      return res.json({
        success: true,
        data: { 
          keywords,
          isRealData: true // Mark as real data from OpenAI
        }
      });

    } catch (error) {
      logger.error('Error generating intelligent keywords:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate keywords',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }),

  /**
   * Run bulk AliExpress keyword analysis
   */
  runBulkAnalysis: asyncHandler(async (req: Request, res: Response) => {
    const { maxCategories = 3, country = 'US', language = 'en', includeProductTitles = true } = req.body;

    try {
      const result = await bulkAnalysisService.runBulkAnalysis({
        maxCategories,
        country,
        language,
        includeProductTitles
      });

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Bulk analysis failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Bulk analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }),

  /**
   * Download bulk analysis spreadsheet
   */
  downloadBulkAnalysis: asyncHandler(async (req: Request, res: Response) => {
    const { maxCategories = 3, country = 'US', language = 'en', includeProductTitles = true } = req.body;

    try {
      const result = await bulkAnalysisService.runBulkAnalysis({
        maxCategories,
        country,
        language,
        includeProductTitles
      });

      if (!result.spreadsheetBuffer) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate spreadsheet'
        });
      }

      const filename = `aliexpress-keyword-analysis-${country}-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(result.spreadsheetBuffer);

    } catch (error) {
      logger.error('Bulk analysis download failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Bulk analysis download failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }),

  /**
   * Analyze custom product titles
   */
  analyzeCustomTitles: asyncHandler(async (req: Request, res: Response) => {
    const { titles, country = 'US', language = 'en' } = req.body;

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product titles array is required'
      });
    }

    try {
      const result = await bulkAnalysisService.analyzeCustomTitles(titles, country, language);

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Custom title analysis failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Custom title analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }),

  /**
   * Download custom title analysis spreadsheet
   */
  downloadCustomAnalysis: asyncHandler(async (req: Request, res: Response) => {
    const { titles, country = 'US', language = 'en' } = req.body;

    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product titles array is required'
      });
    }

    try {
      const result = await bulkAnalysisService.analyzeCustomTitles(titles, country, language);

      if (!result.spreadsheetBuffer) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate spreadsheet'
        });
      }

      const filename = `custom-keyword-analysis-${country}-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(result.spreadsheetBuffer);

    } catch (error) {
      logger.error('Custom analysis download failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Custom analysis download failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }),
};
