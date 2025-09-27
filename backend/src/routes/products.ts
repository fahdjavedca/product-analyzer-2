import { Router } from 'express';
import { productController } from '@/controllers/productController';
import { authLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all routes
router.use(authLimiter);

// Product routes
router.get('/', productController.getProducts);
router.get('/stats', productController.getProductStats);
router.get('/:id', productController.getProductById);
router.post('/import', productController.importProducts);
router.post('/:id/analyze-keywords', productController.analyzeKeywords);
router.delete('/:id', productController.deleteProduct);

// CJ Dropshipping specific routes
router.post('/cj/import-by-keyword', productController.importCJProductsByKeyword);
router.get('/cj/search', productController.searchCJProducts);
router.get('/cj/categories', productController.getCJCategories);

// CJ Dropshipping discovery routes
router.get('/cj/trending', productController.getCJTrendingProducts);
router.get('/cj/best-selling', productController.getCJBestSellingProducts);
router.get('/cj/featured', productController.getCJFeaturedProducts);
router.get('/cj/category/:categoryId', productController.getCJProductsByCategory);

// Generate intelligent keywords using OpenAI
router.post('/generate-keywords', productController.generateIntelligentKeywords);

// Bulk analysis routes
router.post('/bulk-analysis', productController.runBulkAnalysis);
router.post('/bulk-analysis/download', productController.downloadBulkAnalysis);
router.post('/custom-analysis', productController.analyzeCustomTitles);
router.post('/custom-analysis/download', productController.downloadCustomAnalysis);

export default router;
