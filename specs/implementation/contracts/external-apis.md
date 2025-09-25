# External API Contracts

## Google Ads API Integration

### Authentication
- **Method:** OAuth 2.0 with service account
- **Scopes:** `https://www.googleapis.com/auth/adwords`
- **Token Storage:** Encrypted in database or Secret Manager

### Keyword Planning API

#### Get Keyword Ideas
**Endpoint:** `https://googleads.googleapis.com/v14/customers/{customerId}/keywordPlanIdeas:generate`

**Request:**
```json
{
  "keywordPlanNetwork": "GOOGLE_SEARCH",
  "keywordSeed": {
    "keywords": ["wireless headphones", "bluetooth headphones"]
  },
  "language": "1000", // English
  "geoTargetConstants": ["geoTargetConstants/2840"], // United States
  "keywordAndUrlSeed": {
    "url": "https://repacked.co/products/wireless-headphones",
    "keywords": ["wireless headphones"]
  },
  "keywordAnnotation": ["KEYWORD_CONCEPT", "SEARCH_VOLUME", "CPC_BID"]
}
```

**Response:**
```json
{
  "results": [
    {
      "text": "wireless bluetooth headphones",
      "keywordIdeaMetrics": {
        "avgMonthlySearches": 45000,
        "competition": "MEDIUM",
        "competitionIndex": 30000000,
        "lowTopOfPageBidMicros": 850000,
        "highTopOfPageBidMicros": 2150000
      },
      "keywordAnnotations": {
        "concepts": [
          {
            "name": "wireless audio devices",
            "conceptGroup": {
              "name": "audio equipment"
            }
          }
        ]
      }
    }
  ]
}
```

#### Get Historical Metrics
**Endpoint:** `https://googleads.googleapis.com/v14/customers/{customerId}/keywordPlanIdeas:generateKeywordHistoricalMetrics`

**Request:**
```json
{
  "keywordPlanNetwork": "GOOGLE_SEARCH",
  "keywordAnnotations": ["KEYWORD_CONCEPT", "SEARCH_VOLUME", "CPC_BID"],
  "aggregateMetrics": {
    "aggregatedKeywordMetrics": {
      "searchVolume": 45000,
      "competition": "MEDIUM",
      "competitionIndex": 30000000,
      "lowTopOfPageBidMicros": 850000,
      "highTopOfPageBidMicros": 2150000
    }
  }
}
```

### Campaign Management API

#### Create Campaign
**Endpoint:** `https://googleads.googleapis.com/v14/customers/{customerId}/campaigns:mutate`

**Request:**
```json
{
  "operations": [
    {
      "create": {
        "name": "Wireless Headphones - US Campaign",
        "advertisingChannelType": "SEARCH",
        "status": "PAUSED",
        "campaignBudget": "customers/{customerId}/campaignBudgets/{budgetId}",
        "biddingStrategyConfiguration": {
          "biddingStrategyType": "TARGET_SPEND"
        },
        "networkSettings": {
          "targetGoogleSearch": true,
          "targetSearchNetwork": false,
          "targetContentNetwork": false,
          "targetPartnerSearchNetwork": false
        },
        "geoTargetTypeSetting": {
          "negativeGeoTargetType": "DONT_CARE",
          "positiveGeoTargetType": "DONT_CARE"
        },
        "startDate": "2024-12-20",
        "endDate": "2025-01-20"
      }
    }
  ]
}
```

#### Create Ad Group
**Endpoint:** `https://googleads.googleapis.com/v14/customers/{customerId}/adGroups:mutate`

**Request:**
```json
{
  "operations": [
    {
      "create": {
        "name": "Wireless Headphones - General",
        "campaign": "customers/{customerId}/campaigns/{campaignId}",
        "status": "ENABLED",
        "cpcBidMicros": 1500000
      }
    }
  ]
}
```

#### Create Responsive Search Ad
**Endpoint:** `https://googleads.googleapis.com/v14/customers/{customerId}/adGroupAds:mutate`

**Request:**
```json
{
  "operations": [
    {
      "create": {
        "adGroup": "customers/{customerId}/adGroups/{adGroupId}",
        "status": "ENABLED",
        "ad": {
          "responsiveSearchAd": {
            "headlines": [
              {
                "text": "Wireless Bluetooth Headphones",
                "pinnedField": "HEADLINE_1"
              },
              {
                "text": "Premium Sound Quality"
              },
              {
                "text": "Long Battery Life"
              }
            ],
            "descriptions": [
              {
                "text": "Experience superior sound with our wireless bluetooth headphones. Premium quality at an affordable price."
              },
              {
                "text": "Free shipping and 30-day money-back guarantee. Order now and enjoy crystal clear audio."
              }
            ],
            "finalUrls": ["https://repacked.co/products/wireless-bluetooth-headphones"]
          }
        }
      }
    }
  ]
}
```

---

## Shopify Admin API Integration

### Authentication
- **Method:** Access token via Shopify Admin API
- **Scopes:** `read_products,write_products,read_inventory,write_inventory`
- **Token Storage:** Encrypted in database

### Product Management

#### Create Product
**Endpoint:** `https://repacked.co/admin/api/2024-01/products.json`

**Request:**
```json
{
  "product": {
    "title": "Wireless Bluetooth Headphones",
    "body_html": "<p>High-quality wireless bluetooth headphones with superior sound quality and long battery life.</p>",
    "vendor": "TechVendor",
    "product_type": "Electronics",
    "tags": "wireless, bluetooth, headphones, audio",
    "status": "active",
    "images": [
      {
        "src": "https://example.com/image1.jpg",
        "alt": "Wireless Bluetooth Headphones - Front View"
      },
      {
        "src": "https://example.com/image2.jpg",
        "alt": "Wireless Bluetooth Headphones - Side View"
      }
    ],
    "variants": [
      {
        "price": "29.99",
        "compare_at_price": "49.99",
        "inventory_management": "shopify",
        "inventory_quantity": 100,
        "sku": "WH-001"
      }
    ],
    "seo": {
      "title": "Wireless Bluetooth Headphones - Premium Audio Quality",
      "description": "High-quality wireless bluetooth headphones with superior sound quality and long battery life. Free shipping and 30-day guarantee."
    }
  }
}
```

**Response:**
```json
{
  "product": {
    "id": 123456789,
    "title": "Wireless Bluetooth Headphones",
    "handle": "wireless-bluetooth-headphones",
    "created_at": "2024-12-19T10:00:00-05:00",
    "updated_at": "2024-12-19T10:00:00-05:00",
    "published_at": "2024-12-19T10:00:00-05:00",
    "vendor": "TechVendor",
    "product_type": "Electronics",
    "status": "active",
    "tags": "wireless, bluetooth, headphones, audio",
    "variants": [
      {
        "id": 987654321,
        "product_id": 123456789,
        "title": "Default Title",
        "price": "29.99",
        "compare_at_price": "49.99",
        "sku": "WH-001",
        "inventory_quantity": 100,
        "created_at": "2024-12-19T10:00:00-05:00",
        "updated_at": "2024-12-19T10:00:00-05:00"
      }
    ],
    "images": [
      {
        "id": 456789123,
        "product_id": 123456789,
        "src": "https://example.com/image1.jpg",
        "alt": "Wireless Bluetooth Headphones - Front View",
        "created_at": "2024-12-19T10:00:00-05:00",
        "updated_at": "2024-12-19T10:00:00-05:00"
      }
    ],
    "seo": {
      "title": "Wireless Bluetooth Headphones - Premium Audio Quality",
      "description": "High-quality wireless bluetooth headphones with superior sound quality and long battery life. Free shipping and 30-day guarantee."
    }
  }
}
```

#### Update Product
**Endpoint:** `PUT https://repacked.co/admin/api/2024-01/products/{product_id}.json`

#### Get Product
**Endpoint:** `GET https://repacked.co/admin/api/2024-01/products/{product_id}.json`

---

## CJ Dropshipping API Integration

### Authentication
- **Method:** API Key authentication
- **Header:** `Authorization: Bearer {api_key}`
- **Rate Limit:** 100 requests per minute

### Product Catalog

#### Get Product List
**Endpoint:** `https://api.cjdropshipping.com/product/openApi/findProductList`

**Request Parameters:**
```
pageNum: 1
pageSize: 20
categoryId: "electronics"
countryCode: "US"
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 1500,
    "list": [
      {
        "pid": "12345",
        "productName": "Wireless Bluetooth Headphones",
        "productNameEn": "Wireless Bluetooth Headphones",
        "productSku": "WH-001",
        "productWeight": 0.5,
        "productLength": 20,
        "productWidth": 15,
        "productHeight": 8,
        "categoryId": "electronics",
        "categoryName": "Electronics",
        "productType": "physical",
        "productStatus": "active",
        "productImages": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "productPrice": {
          "USD": 29.99
        },
        "productDescription": "High-quality wireless bluetooth headphones...",
        "productDescriptionEn": "High-quality wireless bluetooth headphones...",
        "vendorInfo": {
          "vendorId": "vendor123",
          "vendorName": "TechVendor"
        }
      }
    ]
  }
}
```

#### Get Product Detail
**Endpoint:** `https://api.cjdropshipping.com/product/openApi/findProductDetail`

**Request Parameters:**
```
pid: "12345"
countryCode: "US"
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "pid": "12345",
    "productName": "Wireless Bluetooth Headphones",
    "productNameEn": "Wireless Bluetooth Headphones",
    "productSku": "WH-001",
    "productWeight": 0.5,
    "productLength": 20,
    "productWidth": 15,
    "productHeight": 8,
    "categoryId": "electronics",
    "categoryName": "Electronics",
    "productType": "physical",
    "productStatus": "active",
    "productImages": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "productPrice": {
      "USD": 29.99
    },
    "productDescription": "High-quality wireless bluetooth headphones...",
    "productDescriptionEn": "High-quality wireless bluetooth headphones...",
    "vendorInfo": {
      "vendorId": "vendor123",
      "vendorName": "TechVendor"
    },
    "shippingOptions": [
      {
        "methodName": "Standard Shipping",
        "shippingCost": 6.00,
        "estimatedDays": "5-10",
        "isAvailable": true
      },
      {
        "methodName": "Express Shipping",
        "shippingCost": 12.00,
        "estimatedDays": "3-5",
        "isAvailable": true
      }
    ]
  }
}
```

---

## AliExpress API Integration

### Authentication
- **Method:** API Key authentication
- **Header:** `Authorization: Bearer {api_key}`
- **Rate Limit:** 1000 requests per day

### Product Search

#### Search Products
**Endpoint:** `https://api.aliexpress.com/item/search`

**Request Parameters:**
```
keywords: "wireless headphones"
categoryId: "44"
sort: "price_asc"
pageSize: 20
page: 1
```

**Response:**
```json
{
  "aliexpress_affiliate_product_search_response": {
    "resp_result": {
      "result": {
        "total_results": 5000,
        "products": [
          {
            "product_id": "123456789",
            "product_title": "Wireless Bluetooth Headphones",
            "product_url": "https://www.aliexpress.com/item/wireless-headphones.html",
            "product_main_image_url": "https://example.com/image1.jpg",
            "product_small_image_urls": [
              "https://example.com/image1.jpg",
              "https://example.com/image2.jpg"
            ],
            "product_price": {
              "currency": "USD",
              "formatted_price": "$29.99"
            },
            "product_original_price": {
              "currency": "USD",
              "formatted_price": "$49.99"
            },
            "product_discount": 40,
            "product_rating": 4.5,
            "product_review_count": 1250,
            "product_sale_price": {
              "currency": "USD",
              "formatted_price": "$29.99"
            },
            "product_shipping_cost": {
              "currency": "USD",
              "formatted_price": "$5.99"
            },
            "product_store_info": {
              "store_name": "TechStore",
              "store_url": "https://www.aliexpress.com/store/techstore"
            },
            "product_sale_count": 5000,
            "product_volume": 0.5,
            "product_package_size": "20*15*8",
            "product_package_weight": 0.5
          }
        ]
      }
    }
  }
}
```

---

## Error Handling

### Google Ads API Errors
```json
{
  "error": {
    "code": 400,
    "message": "Request contains an invalid argument.",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.ads.googleads.v14.errors.GoogleAdsFailure",
        "errors": [
          {
            "errorCode": {
              "keywordPlanError": "INVALID_KEYWORD_TEXT"
            },
            "message": "The keyword text is invalid."
          }
        ]
      }
    ]
  }
}
```

### Shopify API Errors
```json
{
  "errors": {
    "title": ["can't be blank"],
    "price": ["must be greater than 0"]
  }
}
```

### CJ Dropshipping API Errors
```json
{
  "code": 400,
  "message": "Invalid product ID",
  "data": null
}
```

### AliExpress API Errors
```json
{
  "aliexpress_affiliate_product_search_response": {
    "resp_result": {
      "result": null,
      "error_code": "INVALID_KEYWORDS",
      "error_message": "Invalid keywords parameter"
    }
  }
}
```

---

## Rate Limiting and Retry Logic

### Rate Limits
- **Google Ads API:** 10,000 operations per day per customer
- **Shopify API:** 40 requests per second
- **CJ Dropshipping API:** 100 requests per minute
- **AliExpress API:** 1000 requests per day

### Retry Strategy
```javascript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [429, 500, 502, 503, 504]
};
```

### Exponential Backoff
```javascript
const delay = Math.min(
  baseDelay * Math.pow(backoffFactor, attempt),
  maxDelay
);
```
