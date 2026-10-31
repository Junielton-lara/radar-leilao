-- CreateTable
CREATE TABLE "intelligence_briefings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cut_off_at" TIMESTAMP(3) NOT NULL,
    "search_run_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'system',
    "metrics_json" JSONB NOT NULL,
    "highlights_json" JSONB NOT NULL,
    "limitations_json" JSONB,
    "body_markdown" TEXT,
    "narrative_markdown" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intelligence_briefings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "intelligence_briefings_cut_off_at_idx" ON "intelligence_briefings"("cut_off_at" DESC);
