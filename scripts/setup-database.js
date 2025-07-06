#!/usr/bin/env node

/**
 * Database Migration Script for FocusFlow
 * 
 * This script creates the necessary database tables for the FocusFlow application.
 * Run this if you're getting "user_id column not found" errors.
 * 
 * Usage: node scripts/setup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createFlowsTable() {
  console.log('🚀 Setting up FocusFlow database schema...\n');

  try {
    // Step 1: Create the flow_status enum
    // Step 1: Create the flow_status enum
    const enumQuery = `
      DO $ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flow_status') THEN
          CREATE TYPE flow_status AS ENUM ('active', 'completed', 'abandoned');
        END IF;
      END
      $;
    `;

    // Step 2: Create the flows table
    const tableQuery = `
      CREATE TABLE IF NOT EXISTS flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        task_description TEXT NOT NULL,
        allowed_urls TEXT[] NOT NULL,
        status flow_status NOT NULL DEFAULT 'active',
        start_time TIMESTAMPTZ DEFAULT NOW(),
        end_time TIMESTAMPTZ
      );
    `;

    // Step 3: Create the activity table
    const activityQuery = `
      CREATE TABLE IF NOT EXISTS activity (
        id BIGSERIAL PRIMARY KEY,
        flow_id UUID REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        is_distraction BOOLEAN NOT NULL DEFAULT FALSE,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Step 4: Enable RLS and create policies
    const rlsQuery = `
      -- Enable RLS on flows table
      ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can see their own flows" ON flows;
      DROP POLICY IF EXISTS "Users can create their own flows" ON flows;
      DROP POLICY IF EXISTS "Users can update their own flows" ON flows;
      
      -- Create new policies for flows
      CREATE POLICY "Users can see their own flows" ON flows FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create their own flows" ON flows FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own flows" ON flows FOR UPDATE USING (auth.uid() = user_id);
      
      -- Enable RLS on activity table
      ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can see activity for their own flows" ON activity;
      
      -- Create new policies for activity
      CREATE POLICY "Users can see activity for their own flows" ON activity FOR SELECT
      USING (
        auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
      );
      CREATE POLICY "Users can insert activity for their own flows" ON activity FOR INSERT
      WITH CHECK (
        auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
      );
    `;

    console.log('1️⃣ Creating flow_status enum...');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('```sql');
    console.log(enumQuery);
    console.log('```');
    console.log('✅ Enum creation SQL provided.');

    // Step 2: Create the flows table
    console.log('2️⃣ Creating flows table...');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('```sql');
    console.log(tableQuery);
    console.log('```');
    console.log('✅ Flows table creation SQL provided.');

    // Step 3: Create the activity table
    console.log('3️⃣ Creating activity table...');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('```sql');
    console.log(activityQuery);
    console.log('```');
    console.log('✅ Activity table creation SQL provided.');

    // Step 4: Enable RLS and create policies
    console.log('4️⃣ Setting up Row Level Security...');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('```sql');
    console.log(rlsQuery);
    console.log('```');
    console.log('✅ Row Level Security configuration SQL provided.');

    console.log('🎉 Database setup instructions provided successfully!');
    console.log('Please execute the SQL commands in your Supabase project\'s SQL Editor.');
    console.log('After running the SQL, your database schema should be correctly set up.');
    console.log('You can then run your FocusFlow application.');

  } catch (error) {
    console.error('\n💥 Setup script failed to generate SQL:', error);
    process.exit(1);
  }
}

// Run the setup
createFlowsTable();
