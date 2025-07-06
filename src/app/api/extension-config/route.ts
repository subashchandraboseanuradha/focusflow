import { NextResponse } from 'next/server';

/**
 * @deprecated This endpoint has been moved to /api/extension/config
 * This file provides backward compatibility and redirects to the new location
 */

export async function GET(request: Request) {
  // Extract the original URL and create new URL for the new endpoint
  const url = new URL(request.url);
  const newUrl = new URL('/api/extension/config', url.origin);
  
  // Forward all headers including Authorization
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  try {
    // Forward the request to the new endpoint
    const response = await fetch(newUrl.toString(), {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    
    // Return the response with a deprecation warning header
    const result = NextResponse.json(data, { status: response.status });
    result.headers.set('X-Deprecated', 'This endpoint is deprecated. Please use /api/extension/config instead.');
    
    return result;
  } catch (error) {
    console.error('Error forwarding request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request. Please use /api/extension/config endpoint.',
        deprecated: true 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // This endpoint has been moved to /api/extension/tasks
  const url = new URL(request.url);
  const newUrl = new URL('/api/extension/tasks', url.origin);
  
  // Forward all headers including Authorization
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  try {
    const body = await request.json();
    
    // Forward the request to the new endpoint
    const response = await fetch(newUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Return the response with a deprecation warning header
    const result = NextResponse.json(data, { status: response.status });
    result.headers.set('X-Deprecated', 'This endpoint is deprecated. Please use /api/extension/tasks instead.');
    
    return result;
  } catch (error) {
    console.error('Error forwarding request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request. Please use /api/extension/tasks endpoint.',
        deprecated: true 
      }, 
      { status: 500 }
    );
  }
}
