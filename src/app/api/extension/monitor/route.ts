import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/extension/monitor
 * Records user activity data from the extension
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables not configured.' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error('Supabase auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      url, 
      title, 
      domain, 
      activityType, 
      timestamp, 
      duration, 
      taskId,
      isDistraction 
    } = await request.json();

    if (!url || !activityType || !timestamp) {
      return NextResponse.json({ 
        error: 'Missing required fields: url, activityType, timestamp' 
      }, { status: 400 });
    }

    // Insert activity record
    const { error: insertError } = await supabase
      .from('user_activities')
      .insert({
        user_id: userData.user.id,
        url,
        title,
        domain,
        activity_type: activityType,
        timestamp: new Date(timestamp).toISOString(),
        duration: duration || 0,
        task_id: taskId,
        is_distraction: isDistraction || false,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting activity:', insertError);
      
      // Check if table doesn't exist
      if (insertError.code === 'PGRST116' || insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database not properly configured. Please run migrations.',
          hint: 'Run the extension migration: 0002_extension_tables.sql'
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
    }

    // If this is a distraction, broadcast a real-time alert
    if (isDistraction && taskId) {
      try {
        await supabase.realtime.channel('distraction-alerts').send({
          type: 'broadcast',
          event: 'distraction_detected',
          payload: { 
            userId: userData.user.id, 
            taskId, 
            url, 
            title, 
            domain,
            timestamp 
          },
        });
      } catch (broadcastError) {
        console.error('Error broadcasting distraction alert:', broadcastError);
      }
    }

    return NextResponse.json({ 
      message: 'Activity recorded successfully',
      isDistraction
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/extension/monitor
 * Retrieves recent activity data for the user
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const taskId = searchParams.get('taskId');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables not configured.' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error('Supabase auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data: activities, error: activitiesError } = await query;

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
