import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    return NextResponse.json({
      supabaseUrl,
      supabaseAnonKey,
    });
  } catch (error) {
    console.error('Error verifying ma:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const { taskId, status } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Missing taskId or status' }, { status: 400 });
    }

    // Update task in Supabase
    const { error: updateError } = await supabase
      .from('tasks') // Assuming you have a 'tasks' table
      .update({ status: status })
      .eq('id', taskId)
      .eq('user_id', userData.user.id); // Ensure the user owns the task

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Broadcast real-time message
    const { error: broadcastError } = await supabase.realtime.channel('task-updates').send({
      type: 'broadcast',
      event: 'task_status_changed',
      payload: { taskId, status, userId: userData.user.id },
    });

    if (broadcastError) {
      console.error('Error broadcasting message:', broadcastError);
      // Continue even if broadcast fails, as the task update is more critical
    }

    return NextResponse.json({ message: 'Task updated and broadcasted successfully' });
  } catch (error) {
    console.error('Error processing task update:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
