'use client';

import { useState, useEffect } from 'react';
import { TaskSetupForm, type TaskDetails } from './task-setup-form';
import { TaskDisplay } from './task-display';
import { ProductivityReport } from './productivity-report';
import { DistractionAlert } from './distraction-alert';
import { FocusCheckinDialog } from './focus-checkin-dialog';
import { generateFocusQuestionAction, updateFlowStatusAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Icons } from './icons';

type Status = 'idle' | 'running' | 'paused' | 'completed';
export type ActivityLog = {
  activity: string;
  timestamp: number;
  isDistraction: boolean;
  reason: string;
};

export type TaskPreset = {
  description: string;
  approvedToolsDescription: string;
  time: number;
};

export function FocusFlowDashboard() {
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [distraction, setDistraction] = useState({ open: false, reason: '' });
  const [focusCheckin, setFocusCheckin] = useState({ open: false, question: '' });
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const { toast } = useToast();
  const [presets, setPresets] = useState<TaskPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);

  useEffect(() => {
    try {
      const savedPresets = window.localStorage.getItem('focusFlowPresets');
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      }
    } catch (error) {
      console.error('Failed to load presets from localStorage', error);
    }
    setIsLoadingPresets(false);
  }, []);

  useEffect(() => {
    if (!isLoadingPresets) {
      try {
        window.localStorage.setItem('focusFlowPresets', JSON.stringify(presets));
      } catch (error) {
        console.error('Failed to save presets to localStorage', error);
      }
    }
  }, [presets, isLoadingPresets]);

  useEffect(() => {
    if (status !== 'running' || timeRemaining <= 0) {
      if (status === 'running' && timeRemaining <= 0) {
        // Timer completed naturally - update database
        const updateFlowOnCompletion = async () => {
          if (taskDetails?.flowId) {
            try {
              const result = await updateFlowStatusAction(taskDetails.flowId, 'completed', new Date());
              if (!result.success) {
                console.error('Failed to update flow status on completion:', result.error);
              }
            } catch (error) {
              console.error('Error updating flow status on completion:', error);
            }
          }
        };
        
        updateFlowOnCompletion();
        setStatus('completed');
        toast({
          title: "Time's up!",
          description: "You've completed your focus session.",
        });
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeRemaining, toast]);

  useEffect(() => {
    if (status !== 'running') return;
  
    const askQuestion = async () => {
      if (!taskDetails) return;
      const result = await generateFocusQuestionAction({ taskDescription: taskDetails.description });
      setFocusCheckin({ open: true, question: result.question });
    };
  
    // Check in every 90 seconds.
    const checkinInterval = setInterval(askQuestion, 90000);
  
    // Ask the first question after an initial delay to let the user get started.
    const firstCheckinTimeout = setTimeout(askQuestion, 45000);
  
    return () => {
      clearInterval(checkinInterval);
      clearTimeout(firstCheckinTimeout);
    };
  }, [status, taskDetails]);


  const handleStartTask = (details: TaskDetails) => {
    setTaskDetails(details);
    setTimeRemaining(details.time * 60);
    setStatus('running');
    setActivityLog([]);

    const newPreset: TaskPreset = {
      description: details.description,
      approvedToolsDescription: details.approvedToolsDescription,
      time: details.time,
    };
    
    if (!presets.some(p => p.description === newPreset.description)) {
      setPresets(prev => [newPreset, ...prev].slice(0, 5));
    }
  };

  const handlePause = () => setStatus('paused');
  const handleResume = () => setStatus('running');
  const handleEnd = async () => {
    if (taskDetails?.flowId) {
      try {
        // Determine if this was an early stop or natural completion
        const wasEarlyStopped = timeRemaining > 0;
        const flowStatus = wasEarlyStopped ? 'abandoned' : 'completed';
        
        const result = await updateFlowStatusAction(taskDetails.flowId, flowStatus, new Date());
        if (!result.success) {
          console.error('Failed to update flow status:', result.error);
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Session ended locally, but failed to update database.',
          });
        }
      } catch (error) {
        console.error('Error updating flow status:', error);
        toast({
          variant: 'destructive',
          title: 'Warning',
          description: 'Session ended locally, but failed to update database.',
        });
      }
    }
    setStatus('completed');
  };
  const handleReset = () => {
    setStatus('idle');
    setTaskDetails(null);
    setTimeRemaining(0);
    setActivityLog([]);
  };

  const handleConfirmFocus = () => {
    setFocusCheckin({ open: false, question: '' });
    const logEntry: ActivityLog = {
      activity: 'Focus Confirmed',
      timestamp: Date.now(),
      isDistraction: false,
      reason: 'User confirmed they are on task during a check-in.',
    };
    setActivityLog((prev) => [...prev, logEntry]);
  };

  const handleReportDistraction = () => {
    setFocusCheckin({ open: false, question: '' });
    const reason = 'You reported getting distracted.';
    const logEntry: ActivityLog = {
      activity: 'Self-Reported Distraction',
      timestamp: Date.now(),
      isDistraction: true,
      reason: reason,
    };
    setActivityLog((prev) => [...prev, logEntry]);
    setDistraction({ open: true, reason });
  };


  const renderContent = () => {
    switch (status) {
      case 'running':
      case 'paused':
        return (
          <TaskDisplay
            task={taskDetails!}
            status={status}
            timeRemaining={timeRemaining}
            onPause={handlePause}
            onResume={handleResume}
            onEnd={handleEnd}
          />
        );
      case 'completed':
        return (
          <ProductivityReport
            task={taskDetails!}
            activityLog={activityLog}
            onReset={handleReset}
          />
        );
      case 'idle':
      default:
        return isLoadingPresets ? (
          <div className="flex justify-center items-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <TaskSetupForm onStartTask={handleStartTask} presets={presets} isLoadingPresets={isLoadingPresets} />
        );
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-3 text-primary">
          <Icons.logo className="h-10 w-10" />
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
            FocusFlow
          </h1>
        </div>
        <p className="text-muted-foreground">
          Your personal companion for deep work and productivity.
        </p>
      </header>
      
      {renderContent()}

      <DistractionAlert
        open={distraction.open}
        reason={distraction.reason}
        onOpenChange={(open) => setDistraction({ ...distraction, open })}
      />

      <FocusCheckinDialog
        open={focusCheckin.open}
        onOpenChange={(open) => setFocusCheckin({ ...focusCheckin, open })}
        question={focusCheckin.question}
        onConfirm={handleConfirmFocus}
        onDistracted={handleReportDistraction}
      />
    </div>
  );
}
