-- Safe migration file
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profession" TEXT;
