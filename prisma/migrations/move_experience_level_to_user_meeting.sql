-- Migration: Move experienceLevel from User to UserMeeting
-- Date: 2025-10-16
-- Reason: Users can join meetings at different experience levels

-- Step 1: Add experienceLevel column to UserMeeting table
ALTER TABLE "UserMeeting" ADD COLUMN "experienceLevel" TEXT;

-- Step 2: Migrate existing data (copy user's experience level to all their meetings)
UPDATE "UserMeeting" um
SET "experienceLevel" = u."experienceLevel"
FROM "User" u
WHERE um."userId" = u.id
AND u."experienceLevel" IS NOT NULL;

-- Step 3: Remove experienceLevel column from User table
ALTER TABLE "User" DROP COLUMN "experienceLevel";

-- Note: The enum ExperienceLevel (BEGINNER, INTERMEDIATE, ADVANCED) remains the same

