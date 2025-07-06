-- Verification script for FocusFlow database schema
-- Run this in your Supabase SQL editor to verify the schema

-- Check if the flow_status type was created
SELECT typname FROM pg_type WHERE typname = 'flow_status';

-- Check if flows table exists with correct columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'flows' 
ORDER BY ordinal_position;

-- Check if activity table exists with correct columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'activity' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('flows', 'activity');

-- Check if policies exist
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename IN ('flows', 'activity');
