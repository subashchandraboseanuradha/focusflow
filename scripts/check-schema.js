const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSchema() {
  console.log('Starting schema check...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Supabase URL:', supabaseUrl);
  console.log('Service key available:', !!serviceRoleKey);

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('Checking flows table...');
    const { data: flows, error: flowsError } = await supabase
      .from('flows')
      .select('*')
      .limit(1);

    if (flowsError) {
      console.error('Error checking flows table:', flowsError);
      
      // Try to create the flows table
      console.log('Attempting to create flows table...');
      
      // First create the enum type
      const { error: enumError } = await supabase.rpc('exec', {
        sql: "CREATE TYPE flow_status AS ENUM ('active', 'completed', 'abandoned');"
      });
      
      if (enumError && !enumError.message.includes('already exists')) {
        console.error('Error creating enum:', enumError);
      }
      
      // Then create the table
      const { error: tableError } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS flows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            task_description TEXT NOT NULL,
            allowed_urls TEXT[] NOT NULL,
            status flow_status NOT NULL DEFAULT 'active',
            start_time TIMESTAMPTZ DEFAULT NOW(),
            end_time TIMESTAMPTZ
          );
        `
      });
      
      if (tableError) {
        console.error('Error creating table:', tableError);
      } else {
        console.log('Successfully created flows table');
      }
      
    } else {
      console.log('Flows table exists:', flows);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkSchema();
