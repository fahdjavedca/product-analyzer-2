# Global Product Analyzer - Research & Analysis

## Feature Overview
The Global Product Analyzer automates the complete dropshipping product workflow from sourcing to ad campaign launch, providing data-driven insights for e-commerce founders.

## Technical Context Analysis

### Architecture Decisions
Based on the provided implementation details:

**Frontend Stack:**
- React 18+ with TypeScript for type safety
- Vite for fast development and building
- Tailwind CSS for utility-first styling
- React Router for client-side routing
- React Query for server state management
- Zustand for client state management

**Backend Stack:**
- Node.js 20 with Express.js
- Local development with nodemon for hot reloading
- Prisma ORM for database operations
- Winston for logging

**Infrastructure:**
- PostgreSQL 16 via Docker Compose for local development
- Redis for caching and job queues (optional)
- Local file storage (`./cache/images`) for development
- Google Cloud Storage for production file storage

**Authentication & Security:**
- Google OAuth for user authentication
- Shopify Admin API token for store integration
- Environment-based secret management (.env.local vs Secret Manager)

## Key Technical Decisions

### 1. Data Model Design
The provided data model is comprehensive and covers all core entities:

**Core Entities:**
- `products`: Central entity storing product information from multiple sources
- `shipping_options`: Flexible shipping data with country-specific information
- `keyword_sets` & `keywords`: Hierarchical keyword data with metrics
- `product_scores`: Calculated opportunity scores
- `shopify_pages`: Integration tracking with Shopify
- `campaigns`: Google Ads campaign management
- `users` & `settings`: User management and preferences

**Key Design Decisions:**
- UUID primary keys for scalability
- JSONB for flexible image storage
- Array types for category paths
- Microsecond precision for budget amounts
- Snapshot timestamps for shipping data

### 2. API Design
The RESTful API design follows clear patterns:

**Resource-Based URLs:**
- `/api/v1/products` for product management
- `/api/v1/campaigns` for campaign operations
- Consistent query parameters for filtering

**Key Operations:**
- Bulk import with batch tracking
- Async keyword analysis
- Campaign creation with validation
- Health checks for monitoring

### 3. Integration Architecture

**External APIs:**
- Google Ads API: Keyword research, campaign management
- Shopify Admin API: Product and page management
- CJ Dropshipping API: Product sourcing
- AliExpress API: Alternative product sourcing

**Integration Patterns:**
- Rate limit handling with exponential backoff
- Graceful degradation for API failures
- Data staleness marking for failed refreshes

### 4. Scoring Algorithm
The weighted linear scoring formula provides:
- Search volume weight: 0.5 (positive impact)
- CPC low weight: -0.3 (negative impact - lower is better)
- Competition weight: -0.2 (negative impact - lower is better)
- Minimum 10 keywords per product
- Opportunity threshold of 0.6

## Critical Technical Considerations

### 1. Performance Requirements
- Product list loading: < 2 seconds
- Keyword analysis: < 30 seconds
- Shopify page creation: < 60 seconds
- Campaign launch: < 10 seconds

### 2. Scalability Constraints
- Support 1000+ concurrent users
- Handle 10,000+ products
- Process 100+ keyword analyses per minute
- Launch 50+ campaigns simultaneously

### 3. Data Accuracy Requirements
- 100% Google Ads API data accuracy (no fallbacks)
- Real-time shipping data synchronization
- Accurate landed cost calculations

### 4. Security Considerations
- CORS configuration for development and production
- CSRF protection for web interfaces
- JWT sessions for API authentication
- Principle of least privilege for API scopes

## Risk Analysis

### High-Risk Areas
1. **External API Dependencies**: Heavy reliance on third-party APIs
2. **Rate Limiting**: Potential bottlenecks in keyword analysis
3. **Data Consistency**: Managing data across multiple external sources
4. **Performance**: Complex scoring calculations with large datasets

### Mitigation Strategies
1. **Caching**: Redis for API responses and calculated scores
2. **Queue Management**: Background jobs for heavy operations
3. **Fallback Mechanisms**: Graceful degradation for API failures
4. **Monitoring**: Comprehensive logging and alerting

## Development Workflow

### Local Development Setup
- Docker Compose for PostgreSQL and Redis
- Separate npm scripts for frontend and backend
- Environment-based configuration
- Prisma Studio for database inspection

### Deployment Strategy
- Development: Local environment with Docker
- Production: Google Cloud Platform
- Cloud Run for backend services
- Cloud SQL for PostgreSQL
- Cloud Storage for file assets

## Success Metrics
- Product validation time: < 5 minutes
- Keyword data accuracy: 100% from Google Ads API
- Shopify page creation success: > 95%
- Campaign launch success: > 90%

## Implementation Priorities
1. **Core Infrastructure**: Database, authentication, basic API
2. **Product Import**: CJ Dropshipping and AliExpress integration
3. **Keyword Analysis**: Google Ads API integration
4. **Shopify Integration**: Page creation and management
5. **Campaign Management**: Google Ads campaign automation
6. **User Interface**: Dashboard and workflow components

## Technical Debt Considerations
- API rate limit handling
- Error recovery mechanisms
- Data validation and sanitization
- Performance optimization for large datasets
- Security hardening for production deployment

## Conclusion
The technical architecture is well-designed with clear separation of concerns, appropriate technology choices, and comprehensive data modeling. The main challenges will be managing external API dependencies and ensuring performance at scale. The implementation plan should prioritize core functionality first, then add advanced features and optimizations.
