-- Migration: Add InterviewType enum and interviewType column to Schedule table
-- This migration adds support for multiple interview types with separate schedule modules

-- Step 1: Create InterviewType enum
CREATE TYPE "InterviewType" AS ENUM (
  'DSA',
  'SYSTEM_DESIGN', 
  'BEHAVIORAL',
  'SQL',
  'DATA_SCIENCE',
  'FRONTEND'
);

-- Step 2: Add interviewType column to Schedule table with default value
ALTER TABLE "Schedule" ADD COLUMN "interviewType" "InterviewType" NOT NULL DEFAULT 'DSA';

-- Step 3: Add index for better query performance
CREATE INDEX "Schedule_interviewType_idx" ON "Schedule"("interviewType");

-- Step 4: Update existing records to DSA type (safety measure)
UPDATE "Schedule" SET "interviewType" = 'DSA' WHERE "interviewType" IS NULL;

-- Step 5: Verify the migration
-- Check that all schedules now have interviewType set
SELECT COUNT(*) as total_schedules, 
       COUNT(CASE WHEN "interviewType" = 'DSA' THEN 1 END) as dsa_schedules
FROM "Schedule";

-- Show sample of updated schedules
SELECT id, title, "interviewType", "startTime", "endTime" 
FROM "Schedule" 
ORDER BY "createdAt" DESC 
LIMIT 5;

