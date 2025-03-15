-- Add role column to UserMeeting if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'UserMeeting' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE "UserMeeting" 
        ADD COLUMN "role" TEXT NOT NULL DEFAULT 'PARTICIPANT';
    END IF;
END $$;