-- Safe migration file
-- Adding completedAt column to Schedule table
DO $$ 
BEGIN 
    -- Check if the column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Schedule' 
        AND column_name = 'completedAt'
    ) THEN
        -- Add the column as nullable (safe operation)
        ALTER TABLE "Schedule" 
        ADD COLUMN "completedAt" TIMESTAMP(3);
    END IF;
END $$;
