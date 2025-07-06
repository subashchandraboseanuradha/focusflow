import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/extension/config
 * Returns configuration data needed by the extension
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables not configured.' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error('Supabase auth error:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if extension wants API-only mode (default to API-only for security)
    const url = new URL(request.url);
    const apiOnly = url.searchParams.get('mode') !== 'supabase'; // Default to API-only

    const response: any = {
      userId: data.user.id,
      userEmail: data.user.email,
      accessToken: token,
      authMode: apiOnly ? 'api-only' : 'supabase-direct'
    };

    // Only include Supabase keys if explicitly requested
    if (!apiOnly) {
      response.supabaseUrl = supabaseUrl;
      response.supabaseAnonKey = supabaseAnonKey;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
