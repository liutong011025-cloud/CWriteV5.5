-- Baseline: existing tables (users, interactions, stories, reviews, letters) already exist in production.
-- This migration is never run; it is marked as applied with: npx prisma migrate resolve --applied 0_init_baseline
-- so that "prisma migrate deploy" only runs the next migration (user_profiles + work_reviews).

SELECT 1;
