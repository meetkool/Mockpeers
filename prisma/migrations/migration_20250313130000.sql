-- Safe migration file
-- Safely rename relation fields without data loss

-- No SQL changes needed for this schema update since:
-- 1. The changes are only in Prisma schema naming
-- 2. The underlying database foreign key constraints and indexes remain the same
-- 3. This is just a Prisma-level change for better code organization

-- Mark migration as complete
SELECT 1;