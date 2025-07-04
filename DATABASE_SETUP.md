# FocusFlow Database Setup Guide

This guide will help you resolve database-related errors in FocusFlow, particularly the "Could not find the 'user_id' column of 'flows' in the schema cache" error.

## Quick Fix

If you're getting the schema cache error, try these steps in order:

1. **Refresh the page** - Sometimes this is just a temporary caching issue
2. **Check your internet connection** - Ensure you can connect to Supabase
3. **Run the database check** - Use the provided script to diagnose the issue
4. **Apply the database migration** - Create the required tables if they're missing

## Database Check Script

Run this command to check if your database is properly set up:

```bash
node scripts/check-database.js
```

This will tell you if the required tables exist and are accessible.

## Manual Database Setup

If the automated scripts don't work, you can manually create the tables in your Supabase dashboard:

### Step 1: Go to Supabase SQL Editor

1. Log into your [Supabase dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor

### Step 2: Run the Migration SQL

Copy and paste this SQL into the editor and run it:

```sql
-- Create enum type for flow status
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

-- Enable Row Level Security
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Create policies for flows table
CREATE POLICY "Users can see their own flows" ON flows 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flows" ON flows 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flows" ON flows 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for activity table
CREATE POLICY "Users can see activity for their own flows" ON activity 
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
  );
CREATE POLICY "Users can insert activity for their own flows" ON activity 
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM flows WHERE id = flow_id)
  );
```

### Step 3: Verify the Setup

After running the SQL, you can verify the setup by running:

```bash
node scripts/check-database.js
```

You should see "Database appears to be set up correctly!" if everything worked.

## Troubleshooting Common Issues

### "user_id column not found in schema cache"

This error typically indicates:
1. **Schema cache issue** - Supabase needs to refresh its cache
2. **Migration not applied** - The tables weren't created properly
3. **Permission issue** - Your service role key might be incorrect

**Solutions:**
- Refresh your browser page
- Check your `.env` file has the correct `SUPABASE_SERVICE_ROLE_KEY`
- Re-run the migration SQL in Supabase dashboard
- Contact Supabase support if the issue persists

### "relation 'flows' does not exist"

This means the tables haven't been created yet.

**Solution:** Run the migration SQL in your Supabase SQL Editor.

### Authentication Errors

If you're getting auth-related errors:
1. Make sure you're signed in to the application
2. Check that your Supabase project has authentication enabled
3. Verify your environment variables are correct

## Environment Variables

Make sure your `.env` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Getting Help

If you're still having issues:

1. Check the browser console for detailed error messages
2. Run `node scripts/check-database.js` and share the output
3. Verify your Supabase project is active and accessible
4. Contact support with your error details

## Database Schema Overview

The FocusFlow application uses two main tables:

- **flows**: Stores focus session information
- **activity**: Tracks user activity during sessions

Both tables use Row Level Security (RLS) to ensure users can only access their own data.
