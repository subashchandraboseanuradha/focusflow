import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/extension/tasks
 * Returns tasks for the authenticated user
 * 
 * Query Parameters:
 * - status: Filter by specific status (active, in_progress, pending, completed)
 * - includeCompleted: Set to 'true' to include completed tasks (default: false)
 * 
 * Examples:
 * - /api/extension/tasks - Returns only active/pending tasks
 * - /api/extension/tasks?includeCompleted=true - Returns all tasks including completed
 * - /api/extension/tasks?status=completed - Returns only completed tasks
 */
export async function GET(request: Request) {
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

    // Get status filter from query parameters (default to active tasks only)
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    
    let query = supabase
      .from('tasks')
      .select('id, title, description, status, allowed_urls, metadata, created_at, updated_at')
      .eq('user_id', userData.user.id);

    // Apply status filtering
    if (statusFilter) {
      // Specific status requested
      query = query.eq('status', statusFilter);
    } else if (includeCompleted) {
      // Include all statuses
      query = query.in('status', ['active', 'in_progress', 'pending', 'completed']);
    } else {
      // Default: only active/pending tasks
      query = query.in('status', ['active', 'in_progress', 'pending']);
    }

    const { data: tasks, error: tasksError } = await query
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      
      // Check if table doesn't exist
      if (tasksError.code === 'PGRST116' || tasksError.message?.includes('relation') || tasksError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database not properly configured. Please run migrations.',
          hint: 'Run the extension migration: 0002_extension_tables.sql'
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/extension/tasks
 * Updates task status from the extension
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

    const { taskId, status, metadata } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Missing taskId or status' }, { status: 400 });
    }

    // Update task in Supabase
    const updateData: any = { 
      status: status,
      updated_at: new Date().toISOString()
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userData.user.id);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Broadcast real-time message
    try {
      const broadcastResponse = await supabase.realtime.channel('task-updates').send({
        type: 'broadcast',
        event: 'task_status_changed',
        payload: { taskId, status, userId: userData.user.id, metadata },
      });

      if (broadcastResponse === 'error') {
        console.error('Error broadcasting message: broadcast failed');
      }
    } catch (broadcastError) {
      console.error('Error broadcasting message:', broadcastError);
    }

    return NextResponse.json({ 
      message: 'Task updated successfully',
      taskId,
      status 
    });
  } catch (error) {
    console.error('Error processing task update:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
