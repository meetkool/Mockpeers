-- Create ENUMs if they don't exist
DO $$ 
BEGIN
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

-- Create tables if they don't exist
DO $$
BEGIN
    -- Create User table
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

    -- Create Admin table
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

    -- Create Schedule table
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

    -- Create UserMeeting table
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
