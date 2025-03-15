-- First, clean up any failed migration state
DELETE FROM "_prisma_migrations" WHERE migration_name = '1_schema_updates';

-- Then proceed with the schema updates
DO $$ 
BEGIN
    -- Create ENUMs if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider') THEN
        CREATE TYPE "Provider" AS ENUM ('EMAIL', 'GOOGLE', 'GITHUB');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedulestatus') THEN
        CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'BOOKED', 'COMPLETED', 'CANCELLED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interviewlevel') THEN
        CREATE TYPE "InterviewLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
    END IF;
END $$;

-- Create or update tables
DO $$
BEGIN
    -- Create User table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        CREATE TABLE "User" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "name" TEXT,
            "image" TEXT,
            "password" TEXT,
            "profession" TEXT,
            "level" "InterviewLevel",
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "provider" "Provider" NOT NULL,
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );

        CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
    END IF;

    -- Create Admin table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Admin') THEN
        CREATE TABLE "Admin" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "password" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
        );

        CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
    END IF;

    -- Create Schedule table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Schedule') THEN
        CREATE TABLE "Schedule" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "startTime" TIMESTAMP(3) NOT NULL,
            "endTime" TIMESTAMP(3) NOT NULL,
            "duration" INTEGER NOT NULL,
            "waitTime" INTEGER NOT NULL DEFAULT 15,
            "counting" INTEGER NOT NULL DEFAULT 0,
            "description" TEXT,
            "meetingUrl" TEXT,
            "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
        );
    END IF;

    -- Create UserMeeting table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserMeeting') THEN
        CREATE TABLE "UserMeeting" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "scheduleId" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'PARTICIPANT',
            "status" TEXT NOT NULL DEFAULT 'JOINED',
            "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "leftAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "UserMeeting_pkey" PRIMARY KEY ("id")
        );

        CREATE INDEX "UserMeeting_userId_idx" ON "UserMeeting"("userId");
        CREATE INDEX "UserMeeting_scheduleId_idx" ON "UserMeeting"("scheduleId");
    END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'UserMeeting_userId_fkey'
    ) THEN
        ALTER TABLE "UserMeeting" 
        ADD CONSTRAINT "UserMeeting_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'UserMeeting_scheduleId_fkey'
    ) THEN
        ALTER TABLE "UserMeeting" 
        ADD CONSTRAINT "UserMeeting_scheduleId_fkey" 
        FOREIGN KEY ("scheduleId") 
        REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Mark migration as applied
INSERT INTO "_prisma_migrations" (version, checksum, started_at, finished_at, migration_name, logs, rolled_back_at, applied_steps_count)
VALUES ('20250311180434', 'consolidated_migration', NOW(), NOW(), 'consolidated_migration', NULL, NULL, 1);
