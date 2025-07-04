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
    console.log('1️⃣ Creating flow_status enum...');
    const enumQuery = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flow_status') THEN
          CREATE TYPE flow_status AS ENUM ('active', 'completed', 'abandoned');
        END IF;
      END
      $$;
    `;

    const { error: enumError } = await supabase.rpc('exec', { sql: enumQuery });
    
    if (enumError && !enumError.message.includes('already exists')) {
      console.error('❌ Failed to create enum:', enumError);
      throw enumError;
    }
    console.log('✅ Enum created successfully');

    // Step 2: Create the flows table
    console.log('2️⃣ Creating flows table...');
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

    const { error: tableError } = await supabase.rpc('exec', { sql: tableQuery });
    
    if (tableError) {
      console.error('❌ Failed to create flows table:', tableError);
      throw tableError;
    }
    console.log('✅ Flows table created successfully');

    // Step 3: Create the activity table
    console.log('3️⃣ Creating activity table...');
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

    const { error: activityError } = await supabase.rpc('exec', { sql: activityQuery });
    
    if (activityError) {
      console.error('❌ Failed to create activity table:', activityError);
      throw activityError;
    }
    console.log('✅ Activity table created successfully');

    // Step 4: Enable RLS and create policies
    console.log('4️⃣ Setting up Row Level Security...');
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
      DROP POLICY IF EXISTS "Users can insert activity for their own flows" ON activity;
      
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

    const { error: rlsError } = await supabase.rpc('exec', { sql: rlsQuery });
    
    if (rlsError) {
      console.error('❌ Failed to setup RLS:', rlsError);
      throw rlsError;
    }
    console.log('✅ Row Level Security configured successfully');

    // Step 5: Test the setup
    console.log('5️⃣ Testing database setup...');
    const { data: testData, error: testError } = await supabase
      .from('flows')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError);
      throw testError;
    }
    console.log('✅ Database test successful');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now run your FocusFlow application.');

  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    console.error('\n📋 Troubleshooting:');
    console.error('1. Ensure you have the correct SUPABASE_SERVICE_ROLE_KEY');
    console.error('2. Check that your Supabase project allows the exec function');
    console.error('3. Verify your database has the necessary permissions');
    process.exit(1);
  }
}

// Run the setup
createFlowsTable();
