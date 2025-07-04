'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, Square, Zap } from 'lucide-react';
import type { TaskDetails } from './task-setup-form';

interface TaskDisplayProps {
  task: TaskDetails;
  status: 'running' | 'paused';
  timeRemaining: number;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function TaskDisplay({ task, status, timeRemaining, onPause, onResume, onEnd }: TaskDisplayProps) {
  const totalTime = task.time * 60;
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  return (
    <Card className="w-full shadow-lg transition-all animate-in fade-in-50">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Flow in Progress</CardTitle>
        <CardDescription className="text-lg">
          {task.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="text-center">
          <p className="text-6xl font-bold font-mono tracking-tighter text-primary">
            {formatTime(timeRemaining)}
          </p>
          <p className="text-muted-foreground">Time Remaining</p>
        </div>
        <Progress value={progress} aria-label={`${Math.round(progress)}% complete`} />
        
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4 text-center">
          <h3 className="font-semibold text-muted-foreground flex items-center justify-center gap-2"><Zap className="h-5 w-5 text-accent"/> Deep Focus Active</h3>
          <p className="text-sm text-muted-foreground px-4">
            Stay on task. We'll check in with you periodically to help you maintain focus.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        {status === 'running' ? (
          <Button variant="outline" onClick={onPause} size="lg">
            <Pause /> Pause
          </Button>
        ) : (
          <Button variant="outline" onClick={onResume} size="lg">
            <Play /> Resume
          </Button>
        )}
        <Button variant="destructive" onClick={onEnd} size="lg">
          <Square /> End Flow
        </Button>
      </CardFooter>
    </Card>
  );
}
