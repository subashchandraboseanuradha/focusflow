import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export interface ExtensionAuthResult {
  success: boolean;
  user?: any;
  supabase?: any;
  error?: string;
  status?: number;
}

/**
 * Common authentication middleware for extension APIs
 */
export async function authenticateExtensionRequest(request: Request): Promise<ExtensionAuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Unauthorized',
      status: 401
    };
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      success: false,
      error: 'Supabase environment variables not configured.',
      status: 500
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error('Supabase auth error:', error);
      return {
        success: false,
        error: 'Unauthorized',
        status: 401
      };
    }

    return {
      success: true,
      user: data.user,
      supabase
    };
  } catch (error) {
    console.error('Error authenticating extension request:', error);
    return {
      success: false,
      error: 'Internal Server Error',
      status: 500
    };
  }
}

/**
 * Helper function to create error responses
 */
export function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Helper function to validate required fields in request body
 */
export function validateRequiredFields(body: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}
