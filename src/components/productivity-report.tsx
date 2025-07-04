'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { TaskDetails } from './task-setup-form';
import type { ActivityLog } from './focus-flow-dashboard';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ProductivityReportProps {
  task: TaskDetails;
  activityLog: ActivityLog[];
  onReset: () => void;
}

export function ProductivityReport({ task, activityLog, onReset }: ProductivityReportProps) {
  const distractions = activityLog.filter(log => log.isDistraction);
  const focusActivities = activityLog.filter(log => !log.isDistraction);

  // We now count check-ins as activity.
  const totalChecks = activityLog.length;
  const distractionCount = distractions.length;
  const distractionPercentage = totalChecks > 0 ? (distractionCount / totalChecks) * 100 : 0;
  const focusPercentage = 100 - distractionPercentage;

  return (
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-center">Flow Complete!</CardTitle>
        <CardDescription className="text-center">
          Here is the summary of your focus session on: "{task.description}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{task.time}<span className="text-base font-medium">min</span></p>
            <p className="text-muted-foreground">Total Time</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{distractionCount}</p>
            <p className="text-muted-foreground">Distractions</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Focus Breakdown</h4>
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted">
            <div className="bg-primary" style={{ width: `${focusPercentage}%` }} title={`Focus: ${focusPercentage.toFixed(0)}%`} />
            <div className="bg-destructive" style={{ width: `${distractionPercentage}%` }} title={`Distractions: ${distractionPercentage.toFixed(0)}%`} />
          </div>
        </div>

        {distractions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertCircle className="text-destructive h-5 w-5"/> Distraction Log</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-3">
              {distractions.map((log, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold">{log.activity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

         {focusActivities.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Focus Log</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-3">
              {focusActivities.map((log, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold">{log.activity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onReset} className="w-full" size="lg">
          <RefreshCw /> Start New Flow
        </Button>
      </CardFooter>
    </Card>
  );
}
