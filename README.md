# Global Product Analyzer

Automated dropshipping product research and validation platform that helps e-commerce founders quickly identify winning products.

## Features

- **Product Import**: Import products from CJ Dropshipping and AliExpress
- **Keyword Analysis**: Analyze keywords using Google Ads API
- **Shopify Integration**: Auto-create SEO-optimized product pages
- **Campaign Management**: Launch and manage Google Ads campaigns
- **Dashboard**: Clean interface for browsing products and managing campaigns

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for development and building
- Tailwind CSS for styling
- React Router for navigation
- React Query for server state
- Zustand for client state

### Backend
- Node.js 20 + Express + TypeScript
- PostgreSQL 16 with Prisma ORM
- Redis for caching and job queues
- Google Ads API integration
- Shopify Admin API integration

### Infrastructure
- Docker Compose for local development
- Google Cloud Platform for production
- Cloud Run, Cloud SQL, Cloud Storage

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd product-analyzer-2

# Quick setup (recommended)
./setup.sh

# OR manual setup:
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cp env.example .env.local
```

Edit `.env.local` with your API keys and configuration:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/product_analyzer_dev"

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

# External APIs
CJ_API_KEY="your-cj-api-key"
ALIEXPRESS_API_KEY="your-aliexpress-api-key"
```

### 3. Start Services

First, make sure Docker Desktop is running, then start the database and Redis:

```bash
# Start Docker services
docker compose up -d

# Or if you have the older docker-compose command:
docker-compose up -d
```

Wait for services to be ready, then run database migrations:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed
cd ..
```

### 4. Start Development Servers

In separate terminals:

```bash
# Backend API (Terminal 1)
npm run dev:api

# Frontend (Terminal 2)
npm run dev:web
```

Or start both at once:

```bash
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/v1/health
- **Prisma Studio**: `cd backend && npx prisma studio`

## Development

### Project Structure

```
product-analyzer-2/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── utils/          # Utilities
│   └── package.json
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── config/         # Configuration
│   ├── prisma/             # Database schema
│   └── package.json
├── docker-compose.yml       # Local services
└── package.json            # Root package.json
```

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:api          # Start backend only
npm run dev:web          # Start frontend only

# Database
npm run db:migrate       # Run migrations
npm run db:reset         # Reset database
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio

# Building
npm run build            # Build both frontend and backend
npm run build:api        # Build backend only
npm run build:web        # Build frontend only

# Testing
npm run test             # Run all tests
npm run test:api         # Run backend tests
npm run test:web         # Run frontend tests

# Linting
npm run lint             # Lint all code
npm run lint:api         # Lint backend
npm run lint:web         # Lint frontend
```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.repacked.co/api/v1`

### Key Endpoints

- `GET /health` - Health check
- `GET /sources` - Available product sources
- `POST /import` - Import products
- `GET /products` - List products with filtering
- `GET /products/:id` - Get product details
- `POST /products/:id/analyze` - Analyze keywords
- `POST /products/:id/shopify` - Create Shopify page
- `POST /campaigns` - Create campaign
- `GET /campaigns` - List campaigns

See `specs/implementation/contracts/api-endpoints.md` for complete API documentation.

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities:

- **Products**: Product information from external sources
- **Shipping Options**: Country-specific shipping data
- **Keywords**: Keyword data with metrics
- **Product Scores**: Calculated opportunity scores
- **Shopify Pages**: Integration tracking
- **Campaigns**: Google Ads campaign management
- **Users**: User management and settings

See `specs/implementation/data-model.md` for complete schema documentation.

## External Integrations

### Google Ads API
- Keyword research and expansion
- Campaign creation and management
- Performance metrics

### Shopify Admin API
- Product page creation
- Image upload and optimization
- SEO metadata

### CJ Dropshipping API
- Product catalog import
- Shipping information
- Pricing data

### AliExpress API
- Alternative product sourcing
- Competitive analysis

## Deployment

### Production Environment

The application is designed to deploy to Google Cloud Platform:

- **Backend**: Cloud Run
- **Database**: Cloud SQL (PostgreSQL)
- **Cache**: Cloud Memorystore (Redis)
- **Storage**: Cloud Storage
- **Frontend**: Cloud Storage with CDN

### Environment Variables for Production

```bash
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@/db?host=/cloudsql/project:region:instance"
REDIS_URL="redis://redis-instance:6379"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

#### Tailwind CSS Errors
If you see errors about missing Tailwind plugins or invalid classes:
```bash
# The plugins are commented out in tailwind.config.js
# Install them only if needed:
cd frontend
npm install @tailwindcss/forms @tailwindcss/typography
```

#### Backend TypeScript Compilation Errors
If you see Prisma event handler errors or module resolution issues:
```bash
cd backend
npm install ts-node tsconfig-paths
```

#### Backend Module Resolution Error
If you see "Cannot find module '@/config'" or similar path mapping errors:
```bash
cd backend
npm install ts-node tsconfig-paths
```

#### Backend ts-node Error
If you see "ts-node: command not found":
```bash
cd backend
npm install ts-node
```

#### Docker Issues
If you see "Cannot connect to the Docker daemon":
```bash
# Start Docker Desktop application
# Then try again:
docker compose up -d
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart postgres

# Check database logs
docker compose logs postgres
```

#### Prisma Environment Variable Issues
If you see "Environment variable not found: DATABASE_URL":
```bash
# Make sure .env.local exists and has the right values
cat .env.local | grep DATABASE_URL

# Load environment variables before running Prisma commands
cd backend
export $(cat ../.env.local | grep -v '^#' | xargs)
npx prisma migrate dev
```

#### Port Conflicts
```bash
# Check what's using port 3000 or 5173
lsof -i :3000
lsof -i :5173

# Kill process using port
kill -9 <PID>
```

#### Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install && cd ..

# Clear Vite cache
rm -rf frontend/.vite
```

#### Backend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf backend/node_modules backend/package-lock.json
cd backend && npm install && cd ..

# Regenerate Prisma client
cd backend && npx prisma generate && cd ..
```

### Environment Issues

Make sure your `.env.local` file exists and has the correct values:
```bash
# Check if .env.local exists
ls -la .env.local

# Copy template if missing
cp env.example .env.local
```

## Support

For questions and support, please contact the development team.
