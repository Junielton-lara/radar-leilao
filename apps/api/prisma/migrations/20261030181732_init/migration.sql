-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ANALYST', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFICADO', 'EM_ANALISE', 'NAO_CONFIRMADO', 'ALTO_RISCO', 'SUSPENSO', 'CANCELADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "AuctionType" AS ENUM ('JUDICIAL', 'EXTRAJUDICIAL', 'PUBLICO', 'PRIVADO');

-- CreateEnum
CREATE TYPE "BrazilianState" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('ORGAO_PUBLICO', 'BANCO', 'FINANCEIRA', 'EMPRESA', 'LEILOEIRO', 'OUTRO');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('TAVILY', 'GOVERNMENT', 'DIARIO_OFICIAL', 'TRIBUNAL', 'PREFEITURA', 'ORGAO_PUBLICO', 'LEILOEIRO', 'PLATAFORMA_PRIVADA', 'BANCO', 'MANUAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "document_number" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auction_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document_number" TEXT,
    "organization_type" "OrganizationType",
    "official_url" TEXT,
    "state" "BrazilianState",
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NAO_CONFIRMADO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctioneers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document_number" TEXT,
    "registration_number" TEXT,
    "commercial_registry" TEXT,
    "state" "BrazilianState",
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NAO_CONFIRMADO',
    "evidence_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctioneers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT,
    "source_type" "SourceType" NOT NULL,
    "category" TEXT,
    "geographic_scope" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "frequency_minutes" INTEGER NOT NULL DEFAULT 1440,
    "last_run_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "success_rate" DECIMAL(5,2),
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "auction_type" "AuctionType",
    "category_id" TEXT,
    "organizer_id" TEXT,
    "auctioneer_id" TEXT,
    "source_id" TEXT,
    "state" "BrazilianState",
    "city" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "appraisal_value" DECIMAL(18,2),
    "minimum_bid" DECIMAL(18,2),
    "commission_percentage" DECIMAL(5,2),
    "publication_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NAO_CONFIRMADO',
    "confidence_score" DECIMAL(5,2),
    "original_url" TEXT,
    "canonical_url" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_lots" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "lot_number" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "appraisal_value" DECIMAL(18,2),
    "minimum_bid" DECIMAL(18,2),
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "status" TEXT,
    "original_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auction_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_documents" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "original_url" TEXT,
    "storage_path" TEXT,
    "file_hash" TEXT,
    "publication_date" TIMESTAMP(3),
    "extracted_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_evidences" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "evidence_type" TEXT NOT NULL,
    "source_url" TEXT,
    "evidence_description" TEXT,
    "evidence_status" TEXT NOT NULL DEFAULT 'collected',
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auction_history" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "reason" TEXT,
    "evidence_json" JSONB,
    "actor" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auction_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "result_json" JSONB NOT NULL,
    "confidence_score" DECIMAL(5,2),
    "token_usage" INTEGER,
    "estimated_cost" DECIMAL(12,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_runs" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "coverage_states" TEXT[],
    "categories" TEXT[],
    "sources_consulted" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "opportunities_found" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_run_items" (
    "id" TEXT NOT NULL,
    "search_run_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "snippet" TEXT,
    "state" "BrazilianState",
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'found',
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_run_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_checks" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "meta_json" JSONB,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filter_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config_json" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "meta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config_json" JSONB NOT NULL,
    "credentials_enc" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "meta_json" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state_coverage" (
    "id" TEXT NOT NULL,
    "state" "BrazilianState" NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "last_searched_at" TIMESTAMP(3),
    "categories_covered" TEXT[],
    "sources_consulted" INTEGER NOT NULL DEFAULT 0,
    "opportunities_found" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "state_coverage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "auction_categories_slug_key" ON "auction_categories"("slug");

-- CreateIndex
CREATE INDEX "organizers_document_number_idx" ON "organizers"("document_number");

-- CreateIndex
CREATE INDEX "organizers_verification_status_idx" ON "organizers"("verification_status");

-- CreateIndex
CREATE INDEX "auctioneers_registration_number_idx" ON "auctioneers"("registration_number");

-- CreateIndex
CREATE INDEX "auctioneers_verification_status_idx" ON "auctioneers"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "sources_slug_key" ON "sources"("slug");

-- CreateIndex
CREATE INDEX "sources_status_idx" ON "sources"("status");

-- CreateIndex
CREATE INDEX "sources_source_type_idx" ON "sources"("source_type");

-- CreateIndex
CREATE UNIQUE INDEX "auctions_slug_key" ON "auctions"("slug");

-- CreateIndex
CREATE INDEX "auctions_verification_status_idx" ON "auctions"("verification_status");

-- CreateIndex
CREATE INDEX "auctions_category_id_idx" ON "auctions"("category_id");

-- CreateIndex
CREATE INDEX "auctions_state_idx" ON "auctions"("state");

-- CreateIndex
CREATE INDEX "auctions_city_idx" ON "auctions"("city");

-- CreateIndex
CREATE INDEX "auctions_end_date_idx" ON "auctions"("end_date");

-- CreateIndex
CREATE INDEX "auctions_publication_date_idx" ON "auctions"("publication_date");

-- CreateIndex
CREATE INDEX "auctions_source_id_idx" ON "auctions"("source_id");

-- CreateIndex
CREATE INDEX "auctions_organizer_id_idx" ON "auctions"("organizer_id");

-- CreateIndex
CREATE INDEX "auctions_canonical_url_idx" ON "auctions"("canonical_url");

-- CreateIndex
CREATE INDEX "auctions_latitude_longitude_idx" ON "auctions"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "auctions_state_verification_status_idx" ON "auctions"("state", "verification_status");

-- CreateIndex
CREATE INDEX "auction_lots_auction_id_idx" ON "auction_lots"("auction_id");

-- CreateIndex
CREATE INDEX "auction_documents_auction_id_idx" ON "auction_documents"("auction_id");

-- CreateIndex
CREATE INDEX "auction_documents_document_type_idx" ON "auction_documents"("document_type");

-- CreateIndex
CREATE INDEX "auction_evidences_auction_id_idx" ON "auction_evidences"("auction_id");

-- CreateIndex
CREATE INDEX "auction_history_auction_id_idx" ON "auction_history"("auction_id");

-- CreateIndex
CREATE INDEX "auction_history_created_at_idx" ON "auction_history"("created_at");

-- CreateIndex
CREATE INDEX "ai_analyses_auction_id_idx" ON "ai_analyses"("auction_id");

-- CreateIndex
CREATE INDEX "search_runs_status_idx" ON "search_runs"("status");

-- CreateIndex
CREATE INDEX "search_runs_created_at_idx" ON "search_runs"("created_at");

-- CreateIndex
CREATE INDEX "search_run_items_search_run_id_idx" ON "search_run_items"("search_run_id");

-- CreateIndex
CREATE INDEX "search_run_items_url_idx" ON "search_run_items"("url");

-- CreateIndex
CREATE INDEX "source_checks_source_id_idx" ON "source_checks"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_user_id_auction_id_key" ON "user_favorites"("user_id", "auction_id");

-- CreateIndex
CREATE INDEX "saved_filters_user_id_idx" ON "saved_filters"("user_id");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_provider_key" ON "integration_settings"("provider");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "state_coverage_state_key" ON "state_coverage"("state");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_categories" ADD CONSTRAINT "auction_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "auction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_auctioneer_id_fkey" FOREIGN KEY ("auctioneer_id") REFERENCES "auctioneers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_lots" ADD CONSTRAINT "auction_lots_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_documents" ADD CONSTRAINT "auction_documents_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_documents" ADD CONSTRAINT "auction_documents_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "auction_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_evidences" ADD CONSTRAINT "auction_evidences_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auction_history" ADD CONSTRAINT "auction_history_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_run_items" ADD CONSTRAINT "search_run_items_search_run_id_fkey" FOREIGN KEY ("search_run_id") REFERENCES "search_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
