# API Endpoints Specification

## Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.repacked.co/api/v1`

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Error Responses
All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional error details
  }
}
```

## Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error

---

## Sources Endpoints

### GET /sources
Get available product sources.

**Response:**
```json
{
  "sources": [
    {
      "id": "cj_dropshipping",
      "name": "CJ Dropshipping",
      "enabled": true,
      "countries": ["US", "CA", "GB", "AU"]
    },
    {
      "id": "aliexpress",
      "name": "AliExpress",
      "enabled": true,
      "countries": ["US", "CA", "GB", "AU"]
    }
  ]
}
```

---

## Import Endpoints

### POST /import
Import products from external sources.

**Request:**
```json
{
  "source_platform": "cj_dropshipping",
  "destination_country": "US",
  "filters": {
    "category": "Electronics",
    "price_min": 10,
    "price_max": 100,
    "limit": 100
  }
}
```

**Response:**
```json
{
  "batch_id": "uuid",
  "imported_count": 85,
  "status": "completed",
  "message": "Import completed successfully"
}
```

---

## Products Endpoints

### GET /products
Get paginated list of products with filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `status` (string) - Filter by status
- `q` (string) - Search query
- `source_platform` (string) - Filter by source platform
- `country` (string) - Filter by destination country
- `score_min` (number) - Minimum opportunity score
- `category` (string) - Filter by category
- `sort` (string) - Sort field (created_at, opp_score, price)
- `order` (string) - Sort order (asc, desc)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "source_platform": "cj_dropshipping",
      "title": "Wireless Bluetooth Headphones",
      "price": 29.99,
      "currency": "USD",
      "vendor_name": "TechVendor",
      "category_path": ["Electronics", "Audio"],
      "images": ["url1", "url2"],
      "shipping_available": true,
      "landed_cost": 35.99,
      "opp_score": 0.75,
      "status": "analyzed",
      "created_at": "2024-12-19T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### GET /products/:id
Get detailed product information.

**Response:**
```json
{
  "id": "uuid",
  "source_platform": "cj_dropshipping",
  "source_product_id": "12345",
  "title": "Wireless Bluetooth Headphones",
  "handle": "wireless-bluetooth-headphones",
  "description_raw": "High quality wireless headphones...",
  "price": 29.99,
  "currency": "USD",
  "vendor_name": "TechVendor",
  "category_path": ["Electronics", "Audio"],
  "images": ["url1", "url2"],
  "shipping_options": [
    {
      "destination_country": "US",
      "is_shippable": true,
      "shipping_cost": 6.00,
      "eta_min_days": 5,
      "eta_max_days": 10,
      "method_name": "Standard Shipping"
    }
  ],
  "keyword_sets": [
    {
      "id": "uuid",
      "country": "US",
      "language": "en",
      "created_at": "2024-12-19T10:00:00Z",
      "keywords_count": 25
    }
  ],
  "product_score": {
    "opp_score": 0.75,
    "reason": "High search volume with low competition",
    "updated_at": "2024-12-19T10:00:00Z"
  },
  "shopify_page": {
    "id": "uuid",
    "shopify_product_id": "shopify_123",
    "url": "https://repacked.co/products/wireless-bluetooth-headphones",
    "status": "published"
  },
  "campaigns": [
    {
      "id": "uuid",
      "google_campaign_id": "google_123",
      "strategy": "MAXIMIZE_CLICKS",
      "daily_budget_micro": 1000000,
      "status": "active"
    }
  ],
  "created_at": "2024-12-19T10:00:00Z",
  "updated_at": "2024-12-19T10:00:00Z"
}
```

---

## Analysis Endpoints

### POST /products/:id/analyze
Analyze keywords for a product.

**Request:**
```json
{
  "seed_keyword": "wireless headphones",
  "country": "US",
  "language": "en"
}
```

**Response:**
```json
{
  "keyword_set_id": "uuid",
  "status": "completed",
  "top_keywords": [
    {
      "term": "wireless bluetooth headphones",
      "avg_monthly_searches": 45000,
      "competition": 0.3,
      "cpc_low": 0.85,
      "cpc_high": 2.15,
      "score": 0.75
    }
  ],
  "analysis_summary": {
    "total_keywords": 25,
    "avg_search_volume": 12000,
    "avg_competition": 0.4,
    "avg_cpc": 1.50
  }
}
```

---

## Shopify Endpoints

### POST /products/:id/shopify
Create Shopify product page.

**Request:**
```json
{
  "taxonomy_category_id": "electronics-audio",
  "selected_keywords": [
    "wireless bluetooth headphones",
    "bluetooth headphones wireless"
  ]
}
```

**Response:**
```json
{
  "shopify_product_id": "shopify_123",
  "url": "https://repacked.co/products/wireless-bluetooth-headphones",
  "status": "published",
  "seo_optimized": {
    "title": "Wireless Bluetooth Headphones - Premium Audio Quality",
    "description": "Experience superior sound with our wireless bluetooth headphones...",
    "meta_title": "Wireless Bluetooth Headphones - Premium Audio Quality",
    "meta_description": "High-quality wireless bluetooth headphones with superior sound..."
  }
}
```

---

## Campaigns Endpoints

### POST /campaigns
Create a new campaign.

**Request:**
```json
{
  "product_id": "uuid",
  "keyword_set_id": "uuid",
  "budget_micro": 1000000,
  "bidding_strategy": "MAXIMIZE_CLICKS",
  "country": "US"
}
```

**Response:**
```json
{
  "campaign_id": "uuid",
  "google_campaign_id": "google_123",
  "status": "pending",
  "estimated_reach": 15000,
  "estimated_clicks": 150,
  "estimated_cost": 225.00
}
```

### GET /campaigns
Get list of campaigns.

**Query Parameters:**
- `status` (string) - Filter by status
- `product_id` (string) - Filter by product
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_title": "Wireless Bluetooth Headphones",
      "google_campaign_id": "google_123",
      "strategy": "MAXIMIZE_CLICKS",
      "daily_budget_micro": 1000000,
      "country": "US",
      "status": "active",
      "performance": {
        "clicks": 45,
        "impressions": 1200,
        "cost": 67.50,
        "ctr": 3.75,
        "cpc": 1.50
      },
      "created_at": "2024-12-19T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

### GET /campaigns/:id
Get campaign details.

**Response:**
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "keyword_set_id": "uuid",
  "google_campaign_id": "google_123",
  "strategy": "MAXIMIZE_CLICKS",
  "daily_budget_micro": 1000000,
  "country": "US",
  "status": "active",
  "ad_groups": [
    {
      "name": "Wireless Headphones - General",
      "keywords": ["wireless bluetooth headphones", "bluetooth headphones"],
      "ads": [
        {
          "headline": "Wireless Bluetooth Headphones",
          "description": "Premium sound quality with long battery life",
          "final_url": "https://repacked.co/products/wireless-bluetooth-headphones"
        }
      ]
    }
  ],
  "performance": {
    "clicks": 45,
    "impressions": 1200,
    "cost": 67.50,
    "ctr": 3.75,
    "cpc": 1.50,
    "conversions": 2,
    "conversion_rate": 4.44
  },
  "created_at": "2024-12-19T10:00:00Z",
  "updated_at": "2024-12-19T10:00:00Z"
}
```

---

## Health Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-19T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "google_ads_api": "healthy",
    "shopify_api": "healthy"
  }
}
```

---

## Rate Limiting

All endpoints are rate limited:
- **Authenticated users:** 1000 requests per hour
- **Import endpoints:** 10 requests per hour
- **Analysis endpoints:** 50 requests per hour
- **Campaign endpoints:** 20 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```
