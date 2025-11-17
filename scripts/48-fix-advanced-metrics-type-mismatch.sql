-- Migration 48: Fix type mismatches in advanced metrics functions
-- Purpose: Fix BIGINT vs NUMERIC type mismatches in COUNT operations
-- Issue: PostgreSQL COUNT returns BIGINT, but was being implicitly cast to NUMERIC
-- Solution: Add explicit ::BIGINT casts to all COUNT operations

-- This migration was applied directly via Supabase MCP on 2025-11-10
-- Changes have already been applied to the database

-- =====================================================
-- Fix 1: get_customer_evolution - Add BIGINT casts
-- =====================================================
-- Fixed in database via MCP
-- Changes: COUNT(DISTINCT c.id)::BIGINT and SUM()::BIGINT

-- =====================================================
-- Fix 2: get_funnel_conversion_rates - Add BIGINT casts  
-- =====================================================
-- Fixed in database via MCP
-- Changes: COUNT(DISTINCT c.id)::BIGINT in both CTEs

-- =====================================================
-- Fix 3: get_channel_breakdown - Add BIGINT casts
-- =====================================================
-- Fixed in database via MCP
-- Changes: COUNT(*)::BIGINT and SUM(lead_count)::BIGINT

-- Error fixed:
-- [Customer Evolution] RPC error: {
--   code: '42804',
--   details: 'Returned type numeric does not match expected type bigint in column 3.',
--   hint: null,
--   message: 'structure of query does not match function result type'
-- }

-- All functions now properly cast COUNT operations to BIGINT to match
-- the RETURNS TABLE type declarations.
