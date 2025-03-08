-- Safe migration that won't delete data
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "waitTime" INTEGER NOT NULL DEFAULT 15;