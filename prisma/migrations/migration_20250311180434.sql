-- Reset failed migration state
DELETE FROM "_prisma_migrations" WHERE migration_name = '1_schema_updates';
DELETE FROM "_prisma_migrations" WHERE migration_name = 'consolidated_migration';

-- Reset the migration state
INSERT INTO "_prisma_migrations" (version, checksum, started_at, finished_at, migration_name, logs, rolled_back_at, applied_steps_count)
VALUES ('20250311180434', 'reset_migration', NOW(), NOW(), 'reset_migration', NULL, NULL, 1);
