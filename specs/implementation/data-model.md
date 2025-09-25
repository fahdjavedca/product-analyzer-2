# Global Product Analyzer - Data Model

## Database Schema

### Core Tables

#### products
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_platform TEXT NOT NULL CHECK (source_platform IN ('cj_dropshipping', 'aliexpress')),
    source_product_id TEXT NOT NULL,
    title TEXT NOT NULL,
    handle TEXT UNIQUE,
    description_raw TEXT,
    price NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    vendor_name TEXT,
    category_path TEXT[],
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(source_platform, source_product_id)
);

CREATE INDEX idx_products_source_platform ON products(source_platform);
CREATE INDEX idx_products_category_path ON products USING GIN(category_path);
CREATE INDEX idx_products_created_at ON products(created_at);
```

#### shipping_options
```sql
CREATE TABLE shipping_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    destination_country TEXT NOT NULL,
    is_shippable BOOLEAN NOT NULL DEFAULT false,
    shipping_cost NUMERIC(10,2),
    eta_min_days INTEGER,
    eta_max_days INTEGER,
    method_name TEXT,
    snapshot_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, destination_country, method_name)
);

CREATE INDEX idx_shipping_options_product_id ON shipping_options(product_id);
CREATE INDEX idx_shipping_options_country ON shipping_options(destination_country);
CREATE INDEX idx_shipping_options_shippable ON shipping_options(is_shippable);
```

#### keyword_sets
```sql
CREATE TABLE keyword_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_keyword_sets_product_id ON keyword_sets(product_id);
CREATE INDEX idx_keyword_sets_country ON keyword_sets(country);
```

#### keywords
```sql
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_set_id UUID NOT NULL REFERENCES keyword_sets(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    avg_monthly_searches INTEGER,
    competition NUMERIC(3,2) CHECK (competition >= 0 AND competition <= 1),
    cpc_low NUMERIC(10,2),
    cpc_high NUMERIC(10,2),
    score NUMERIC(10,4),
    
    UNIQUE(keyword_set_id, term)
);

CREATE INDEX idx_keywords_set_id ON keywords(keyword_set_id);
CREATE INDEX idx_keywords_term ON keywords(term);
CREATE INDEX idx_keywords_score ON keywords(score DESC);
```

#### product_scores
```sql
CREATE TABLE product_scores (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    keyword_set_id UUID REFERENCES keyword_sets(id) ON DELETE SET NULL,
    opp_score NUMERIC(10,4) NOT NULL,
    reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_scores_opp_score ON product_scores(opp_score DESC);
```

#### shopify_pages
```sql
CREATE TABLE shopify_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    shopify_product_id TEXT UNIQUE,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'created', 'published', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopify_pages_product_id ON shopify_pages(product_id);
CREATE INDEX idx_shopify_pages_status ON shopify_pages(status);
```

#### campaigns
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    keyword_set_id UUID NOT NULL REFERENCES keyword_sets(id) ON DELETE CASCADE,
    google_campaign_id TEXT UNIQUE,
    strategy TEXT NOT NULL CHECK (strategy IN ('MAXIMIZE_CLICKS', 'MAXIMIZE_CONVERSIONS')),
    daily_budget_micro BIGINT NOT NULL,
    country TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'ended', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_product_id ON campaigns(product_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_country ON campaigns(country);
```

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    provider_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_id ON users(provider_id);
```

#### settings
```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_country TEXT NOT NULL DEFAULT 'US',
    language TEXT NOT NULL DEFAULT 'en',
    bidding_strategy TEXT NOT NULL DEFAULT 'MAXIMIZE_CLICKS',
    daily_budget_micro BIGINT NOT NULL DEFAULT 1000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_settings_user_id ON settings(user_id);
```

## Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id              String    @id @default(uuid()) @db.Uuid
  sourcePlatform  String    @map("source_platform") @db.Text
  sourceProductId String    @map("source_product_id") @db.Text
  title           String    @db.Text
  handle          String?   @unique @db.Text
  descriptionRaw  String?   @map("description_raw") @db.Text
  price           Decimal   @db.Decimal(10, 2)
  currency        String    @default("USD") @db.Text
  vendorName      String?   @map("vendor_name") @db.Text
  categoryPath    String[]  @map("category_path") @db.Text
  images          Json      @default("[]")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  shippingOptions ShippingOption[]
  keywordSets     KeywordSet[]
  productScores   ProductScore?
  shopifyPages    ShopifyPage[]
  campaigns       Campaign[]

  @@unique([sourcePlatform, sourceProductId])
  @@map("products")
}

model ShippingOption {
  id                String   @id @default(uuid()) @db.Uuid
  productId         String   @map("product_id") @db.Uuid
  destinationCountry String  @map("destination_country") @db.Text
  isShippable       Boolean  @default(false) @map("is_shippable")
  shippingCost      Decimal? @map("shipping_cost") @db.Decimal(10, 2)
  etaMinDays        Int?     @map("eta_min_days")
  etaMaxDays        Int?     @map("eta_max_days")
  methodName        String?  @map("method_name") @db.Text
  snapshotTs        DateTime @default(now()) @map("snapshot_ts") @db.Timestamptz

  // Relations
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, destinationCountry, methodName])
  @@map("shipping_options")
}

model KeywordSet {
  id        String   @id @default(uuid()) @db.Uuid
  productId String   @map("product_id") @db.Uuid
  country   String   @db.Text
  language  String   @default("en") @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  product        Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  keywords       Keyword[]
  productScores  ProductScore[]
  campaigns      Campaign[]

  @@map("keyword_sets")
}

model Keyword {
  id                  String   @id @default(uuid()) @db.Uuid
  keywordSetId        String   @map("keyword_set_id") @db.Uuid
  term                String   @db.Text
  avgMonthlySearches  Int?
  competition         Decimal? @db.Decimal(3, 2)
  cpcLow              Decimal? @map("cpc_low") @db.Decimal(10, 2)
  cpcHigh             Decimal? @map("cpc_high") @db.Decimal(10, 2)
  score               Decimal? @db.Decimal(10, 4)

  // Relations
  keywordSet KeywordSet @relation(fields: [keywordSetId], references: [id], onDelete: Cascade)

  @@unique([keywordSetId, term])
  @@map("keywords")
}

model ProductScore {
  productId     String    @id @map("product_id") @db.Uuid
  keywordSetId  String?   @map("keyword_set_id") @db.Uuid
  oppScore      Decimal   @map("opp_score") @db.Decimal(10, 4)
  reason        String?   @db.Text
  updatedAt     DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  keywordSet KeywordSet? @relation(fields: [keywordSetId], references: [id], onDelete: SetNull)

  @@map("product_scores")
}

model ShopifyPage {
  id               String   @id @default(uuid()) @db.Uuid
  productId        String   @map("product_id") @db.Uuid
  shopifyProductId String?  @unique @map("shopify_product_id") @db.Text
  url              String?  @db.Text
  status           String   @default("pending") @db.Text
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("shopify_pages")
}

model Campaign {
  id                String   @id @default(uuid()) @db.Uuid
  productId         String   @map("product_id") @db.Uuid
  keywordSetId      String   @map("keyword_set_id") @db.Uuid
  googleCampaignId  String?  @unique @map("google_campaign_id") @db.Text
  strategy          String   @db.Text
  dailyBudgetMicro  BigInt   @map("daily_budget_micro")
  country           String   @db.Text
  status            String   @default("pending") @db.Text
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  keywordSet KeywordSet  @relation(fields: [keywordSetId], references: [id], onDelete: Cascade)

  @@map("campaigns")
}

model User {
  id         String   @id @default(uuid()) @db.Uuid
  email      String   @unique @db.Text
  providerId String   @map("provider_id") @db.Text
  role       String   @default("user") @db.Text
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  settings Settings[]

  @@map("users")
}

model Settings {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @map("user_id") @db.Uuid
  defaultCountry    String   @default("US") @map("default_country") @db.Text
  language          String   @default("en") @db.Text
  biddingStrategy   String   @default("MAXIMIZE_CLICKS") @map("bidding_strategy") @db.Text
  dailyBudgetMicro  BigInt   @default(1000000) @map("daily_budget_micro")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("settings")
}
```

## Data Relationships

### Entity Relationship Diagram
```
users (1) -----> (0..n) settings
users (1) -----> (0..n) products (via ownership/import)

products (1) -----> (0..n) shipping_options
products (1) -----> (0..n) keyword_sets
products (1) -----> (0..1) product_scores
products (1) -----> (0..n) shopify_pages
products (1) -----> (0..n) campaigns

keyword_sets (1) -----> (0..n) keywords
keyword_sets (1) -----> (0..n) product_scores
keyword_sets (1) -----> (0..n) campaigns
```

## Data Validation Rules

### Product Validation
- `source_platform` must be either 'cj_dropshipping' or 'aliexpress'
- `price` must be positive
- `currency` must be a valid ISO currency code
- `images` must be a valid JSON array

### Shipping Options Validation
- `is_shippable` must be true if shipping_cost is provided
- `eta_min_days` must be less than or equal to `eta_max_days`
- `shipping_cost` must be positive if provided

### Keyword Validation
- `competition` must be between 0 and 1
- `cpc_low` must be less than or equal to `cpc_high`
- `score` must be calculated based on the weighted formula

### Campaign Validation
- `strategy` must be either 'MAXIMIZE_CLICKS' or 'MAXIMIZE_CONVERSIONS'
- `daily_budget_micro` must be positive
- `status` must be one of the defined enum values

## Indexing Strategy

### Primary Indexes
- All primary keys (UUID) are automatically indexed
- Unique constraints create unique indexes

### Performance Indexes
- `products.source_platform` for filtering by source
- `products.category_path` using GIN index for array operations
- `shipping_options.destination_country` for country filtering
- `keywords.score` for sorting by opportunity score
- `product_scores.opp_score` for ranking products

### Composite Indexes
- `(source_platform, source_product_id)` for product uniqueness
- `(product_id, destination_country, method_name)` for shipping uniqueness
- `(keyword_set_id, term)` for keyword uniqueness

## Migration Strategy

### Initial Migration
1. Create all tables with proper constraints
2. Add initial indexes
3. Set up foreign key relationships
4. Create initial admin user

### Future Migrations
- Use Prisma migrations for schema changes
- Version all migrations with timestamps
- Test migrations on staging environment first
- Backup database before production migrations

## Data Archival Strategy

### Retention Policies
- Keep all active products indefinitely
- Archive failed imports after 30 days
- Archive old shipping snapshots after 90 days
- Archive completed campaigns after 1 year

### Archival Process
- Move old data to archive tables
- Maintain referential integrity
- Update indexes for archived data
- Monitor performance impact
