-- Safe migration file
-- Adding startedAt column to Schedule table
DO $$ 
BEGIN 
    -- Check if the column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Schedule' 
        AND column_name = 'startedAt'
    ) THEN
        -- Add the column as nullable (safe operation)
        ALTER TABLE "Schedule" 
        ADD COLUMN "startedAt" TIMESTAMP(3);
    END IF;
END $$;