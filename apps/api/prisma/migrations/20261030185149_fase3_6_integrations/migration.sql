-- CreateTable
CREATE TABLE "tavily_cache" (
    "id" TEXT NOT NULL,
    "query_hash" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "response_json" JSONB NOT NULL,
    "credits_used" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tavily_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_usage_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "credits_estimated" INTEGER,
    "tokens_used" INTEGER,
    "estimated_cost" DECIMAL(12,6),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "meta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_duplicate_links" (
    "id" TEXT NOT NULL,
    "primary_auction_id" TEXT NOT NULL,
    "duplicate_auction_id" TEXT NOT NULL,
    "match_type" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_duplicate_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tavily_cache_day_idx" ON "tavily_cache"("day");

-- CreateIndex
CREATE UNIQUE INDEX "tavily_cache_query_hash_day_endpoint_key" ON "tavily_cache"("query_hash", "day", "endpoint");

-- CreateIndex
CREATE INDEX "integration_usage_logs_provider_created_at_idx" ON "integration_usage_logs"("provider", "created_at");

-- CreateIndex
CREATE INDEX "integration_usage_logs_created_at_idx" ON "integration_usage_logs"("created_at");

-- CreateIndex
CREATE INDEX "auction_duplicate_links_primary_auction_id_idx" ON "auction_duplicate_links"("primary_auction_id");

-- CreateIndex
CREATE INDEX "auction_duplicate_links_duplicate_auction_id_idx" ON "auction_duplicate_links"("duplicate_auction_id");

-- CreateIndex
CREATE UNIQUE INDEX "auction_duplicate_links_primary_auction_id_duplicate_auctio_key" ON "auction_duplicate_links"("primary_auction_id", "duplicate_auction_id");
