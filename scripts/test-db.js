const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  try {
    console.log('Script starting...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.log('Key:', serviceRoleKey ? 'Found' : 'Missing');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables');
      process.exit(1);
    }
    
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    console.log('Testing connection...');
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Auth error:', error);
    } else {
      console.log('Connection test successful');
    }
    
    console.log('Checking flows table...');
    const { data: flows, error: flowsError } = await supabase
      .from('flows')
      .select('*')
      .limit(1);
      
    if (flowsError) {
      console.error('Flows table error:', flowsError);
    } else {
      console.log('Flows table accessible, sample data:', flows);
    }
    
  } catch (err) {
    console.error('Unhandled error:', err);
  }
}

main().catch(console.error);
