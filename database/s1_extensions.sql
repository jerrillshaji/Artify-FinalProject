-- ============================================================
-- ARTIFY: UNIFIED SUPABASE SQL (SINGLE FILE)
-- This file combines schema + RLS + triggers + auth helpers.
-- Run top-to-bottom in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
