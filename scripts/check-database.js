#!/usr/bin/env node

/**
 * Alternative Database Setup for FocusFlow
 * 
 * This script attempts to create tables using Supabase REST API
 * if direct SQL execution is not available.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupDatabase() {
  console.log('🔍 Checking database setup...\n');

  try {
    // Test if flows table exists
    console.log('1️⃣ Testing flows table...');
    const { data: flowsTest, error: flowsError } = await supabase
      .from('flows')
      .select('*')
      .limit(1);

    if (flowsError) {
      console.error('❌ Flows table error:', flowsError.message);
      
      if (flowsError.message.includes('relation "flows" does not exist') ||
          flowsError.message.includes('Could not find')) {
        console.log('\n📋 MANUAL SETUP REQUIRED:');
        console.log('The flows table does not exist. Please run this SQL in your Supabase SQL editor:\n');
        
        console.log(`-- Create enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flow_status') THEN
    CREATE TYPE flow_status AS ENUM ('active', 'completed', 'abandoned');
  END IF;
END
$$;

-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_description TEXT NOT NULL,
  allowed_urls TEXT[] NOT NULL,
  status flow_status NOT NULL DEFAULT 'active',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ
);

-- Create activity table
CREATE TABLE IF NOT EXISTS activity (
  id BIGSERIAL PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  is_distraction BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Create policies for flows
CREATE POLICY "Users can see their own flows" ON flows 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flows" ON flows 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flows" ON flows 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for activity
CREATE POLICY "Users can see activity for their own flows" ON activity 
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
  );
CREATE POLICY "Users can insert activity for their own flows" ON activity 
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
  );`);
        
        console.log('\n📝 Steps to fix:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Run the query');
        console.log('5. Try running your application again');
        
      } else {
        console.log('❌ Unexpected error:', flowsError);
      }
    } else {
      console.log('✅ Flows table exists and is accessible');
      
      // Test activity table
      console.log('2️⃣ Testing activity table...');
      const { error: activityError } = await supabase
        .from('activity')
        .select('*')
        .limit(1);

      if (activityError) {
        console.log('❌ Activity table issue:', activityError.message);
      } else {
        console.log('✅ Activity table exists and is accessible');
      }
      
      console.log('\n🎉 Database appears to be set up correctly!');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

setupDatabase();
