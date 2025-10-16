-- Migration: Add enhanced profile fields to User table
-- Run this manually if you can't use prisma migrate due to drift
-- Or use: npx prisma db push

-- Create ExperienceLevel enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to User table (safe - won't fail if columns exist)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "leetcodeUsername" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "experienceLevel" "ExperienceLevel";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "interviewLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "readLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "questionDifficulties" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing users to have empty arrays for the new fields
UPDATE "User" SET "interviewLanguages" = ARRAY[]::TEXT[] WHERE "interviewLanguages" IS NULL;
UPDATE "User" SET "readLanguages" = ARRAY[]::TEXT[] WHERE "readLanguages" IS NULL;
UPDATE "User" SET "questionDifficulties" = ARRAY[]::TEXT[] WHERE "questionDifficulties" IS NULL;

