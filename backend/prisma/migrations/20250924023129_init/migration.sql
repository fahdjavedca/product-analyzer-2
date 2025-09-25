-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "source_platform" TEXT NOT NULL,
    "source_product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "description_raw" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "vendor_name" TEXT,
    "category_path" TEXT[],
    "images" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_options" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "destination_country" TEXT NOT NULL,
    "is_shippable" BOOLEAN NOT NULL DEFAULT false,
    "shipping_cost" DECIMAL(10,2),
    "eta_min_days" INTEGER,
    "eta_max_days" INTEGER,
    "method_name" TEXT,
    "snapshot_ts" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_sets" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" UUID NOT NULL,
    "keyword_set_id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "avgMonthlySearches" INTEGER,
    "competition" DECIMAL(3,2),
    "cpc_low" DECIMAL(10,2),
    "cpc_high" DECIMAL(10,2),
    "score" DECIMAL(10,4),

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_scores" (
    "product_id" UUID NOT NULL,
    "keyword_set_id" UUID,
    "opp_score" DECIMAL(10,4) NOT NULL,
    "reason" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_scores_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "shopify_pages" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "shopify_product_id" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopify_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "keyword_set_id" UUID NOT NULL,
    "google_campaign_id" TEXT,
    "strategy" TEXT NOT NULL,
    "daily_budget_micro" BIGINT NOT NULL,
    "country" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "default_country" TEXT NOT NULL DEFAULT 'US',
    "language" TEXT NOT NULL DEFAULT 'en',
    "bidding_strategy" TEXT NOT NULL DEFAULT 'MAXIMIZE_CLICKS',
    "daily_budget_micro" BIGINT NOT NULL DEFAULT 1000000,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_handle_key" ON "products"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "products_source_platform_source_product_id_key" ON "products"("source_platform", "source_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_options_product_id_destination_country_method_name_key" ON "shipping_options"("product_id", "destination_country", "method_name");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_keyword_set_id_term_key" ON "keywords"("keyword_set_id", "term");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_pages_shopify_product_id_key" ON "shopify_pages"("shopify_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_google_campaign_id_key" ON "campaigns"("google_campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "shipping_options" ADD CONSTRAINT "shipping_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keyword_sets" ADD CONSTRAINT "keyword_sets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_keyword_set_id_fkey" FOREIGN KEY ("keyword_set_id") REFERENCES "keyword_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scores" ADD CONSTRAINT "product_scores_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scores" ADD CONSTRAINT "product_scores_keyword_set_id_fkey" FOREIGN KEY ("keyword_set_id") REFERENCES "keyword_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_pages" ADD CONSTRAINT "shopify_pages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_keyword_set_id_fkey" FOREIGN KEY ("keyword_set_id") REFERENCES "keyword_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
