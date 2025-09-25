import { Router } from 'express';
import healthRoutes from './health';
import productRoutes from './products';
import testRoutes from './test';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Product routes
router.use('/products', productRoutes);

// Test routes (remove in production)
router.use('/', testRoutes);

// API routes will be added here
// router.use('/sources', sourcesRoutes);
// router.use('/import', importRoutes);
// router.use('/campaigns', campaignsRoutes);

export default router;
