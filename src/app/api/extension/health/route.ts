import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/extension/health
 * Health check endpoint for the extension to verify connectivity
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  // For health check, we can allow both authenticated and unauthenticated requests
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Supabase environment variables not configured.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // Basic connectivity test
    const { error } = await supabase.from('tasks').select('count').limit(1);
    
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: error ? 'error' : 'ok',
        auth: 'ok'
      }
    };

    // If authenticated, verify token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data, error: authError } = await supabase.auth.getUser(token);
      
      response.services.auth = authError || !data?.user ? 'error' : 'ok';
      
      if (data?.user) {
        (response as any).user = {
          id: data.user.id,
          email: data.user.email
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Internal server error during health check',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
