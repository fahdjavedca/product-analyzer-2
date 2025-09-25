# Global Product Analyzer - Quick Start Guide

## Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose installed
- Git installed
- Google Cloud Platform account (for production)
- API keys for external services

## Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd product-analyzer-2

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Create `.env.local` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/product_analyzer_dev"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
JWT_SECRET="your-jwt-secret-key"

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"
GOOGLE_ADS_CLIENT_ID="your-client-id"
GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
GOOGLE_ADS_REFRESH_TOKEN="your-refresh-token"

# Shopify
SHOPIFY_STORE_URL="https://repacked.co"
SHOPIFY_ACCESS_TOKEN="your-shopify-access-token"

# CJ Dropshipping
CJ_API_KEY="your-cj-api-key"

# AliExpress
ALIEXPRESS_API_KEY="your-aliexpress-api-key"

# File Storage
UPLOAD_DIR="./cache/images"
GCS_BUCKET_NAME="your-gcs-bucket-name"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis with Docker Compose
docker-compose up -d

# Wait for database to be ready
sleep 10

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio to inspect database
npx prisma studio
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend API
npm run dev:api

# Terminal 2: Start frontend
npm run dev:web
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Prisma Studio: http://localhost:5555

## Project Structure

```
product-analyzer-2/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── store/          # Zustand state management
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic services
│   │   ├── models/         # Data models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── docker-compose.yml       # Local development services
├── .env.local              # Environment variables
└── package.json            # Root package.json with scripts
```

## Development Scripts

### Root Level Scripts

```bash
# Start both frontend and backend in development mode
npm run dev

# Start only backend API
npm run dev:api

# Start only frontend
npm run dev:web

# Run database migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
npm run db:studio

# Run tests
npm run test

# Run linting
npm run lint

# Build for production
npm run build
```

### Backend Scripts

```bash
cd backend

# Start with nodemon (hot reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Build TypeScript
npm run build
```

### Frontend Scripts

```bash
cd frontend

# Start Vite dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run linting
npm run lint
```

## API Testing

### Using curl

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Get products (requires authentication)
curl -H "Authorization: Bearer <jwt-token>" \
     http://localhost:3000/api/v1/products

# Import products from CJ Dropshipping
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <jwt-token>" \
     -d '{"source_platform": "cj_dropshipping", "destination_country": "US"}' \
     http://localhost:3000/api/v1/import
```

### Using Postman

Import the API collection from `docs/postman/Global-Product-Analyzer-API.json`

## Database Management

### Prisma Commands

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Deploy migrations to production
npx prisma migrate deploy

# Reset database and apply all migrations
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Introspect existing database
npx prisma db pull

# Push schema changes without migration
npx prisma db push
```

### Common Database Operations

```bash
# Connect to PostgreSQL directly
docker exec -it product-analyzer-2-postgres-1 psql -U postgres -d product_analyzer_dev

# View database logs
docker-compose logs postgres

# Backup database
docker exec product-analyzer-2-postgres-1 pg_dump -U postgres product_analyzer_dev > backup.sql

# Restore database
docker exec -i product-analyzer-2-postgres-1 psql -U postgres product_analyzer_dev < backup.sql
```

## External API Setup

### Google Ads API

1. Create a Google Ads account
2. Apply for API access
3. Create OAuth 2.0 credentials
4. Get developer token, client ID, and client secret
5. Generate refresh token using OAuth flow

### Shopify Admin API

1. Create a Shopify app in your store admin
2. Configure API access scopes
3. Generate access token
4. Test API connection

### CJ Dropshipping API

1. Register for CJ Dropshipping account
2. Apply for API access
3. Get API key from dashboard

### AliExpress API

1. Register for AliExpress Affiliate program
2. Apply for API access
3. Get API key from affiliate dashboard

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process using port
kill -9 <PID>

# Or change port in .env.local
PORT=3001
```

#### API Rate Limits
- Check API usage in external service dashboards
- Implement proper retry logic with exponential backoff
- Use Redis caching to reduce API calls

#### Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=product-analyzer:*
```

### Performance Issues

1. **Database Performance**
   - Check query performance with `EXPLAIN ANALYZE`
   - Add database indexes for frequently queried fields
   - Use connection pooling

2. **API Performance**
   - Implement Redis caching
   - Use background jobs for heavy operations
   - Optimize database queries

3. **Frontend Performance**
   - Use React Query for data fetching
   - Implement virtual scrolling for large lists
   - Optimize bundle size with code splitting

## Production Deployment

### Environment Variables for Production

```bash
# Database (Cloud SQL)
DATABASE_URL="postgresql://user:pass@/db?host=/cloudsql/project:region:instance"

# Redis (Cloud Memorystore)
REDIS_URL="redis://redis-instance:6379"

# Google Cloud Storage
GCS_BUCKET_NAME="your-production-bucket"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Application
NODE_ENV="production"
PORT=8080
FRONTEND_URL="https://repacked.co"
```

### Deployment Steps

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy to Google Cloud Run**
   ```bash
   gcloud run deploy product-analyzer-api \
     --source=backend \
     --platform=managed \
     --region=us-central1 \
     --allow-unauthenticated
   ```

3. **Deploy Frontend**
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # Deploy to Google Cloud Storage or CDN
   gsutil -m cp -r dist/* gs://your-bucket-name/
   ```

## Monitoring and Logging

### Development Logging
- Console output for all logs
- Winston for structured logging
- Debug mode for detailed information

### Production Logging
- Cloud Logging integration
- Structured JSON logs
- Error tracking and alerting
- Performance monitoring

### Health Checks
- Database connectivity
- External API availability
- Redis connectivity
- File storage access

## Next Steps

1. **Set up external API credentials**
2. **Import initial product data**
3. **Test keyword analysis functionality**
4. **Create first Shopify product page**
5. **Launch test campaign**
6. **Monitor performance and optimize**

For detailed implementation guidance, refer to the `tasks.md` file which breaks down all development tasks into actionable items.
