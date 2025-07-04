'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DistractionAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
}

export function DistractionAlert({ open, onOpenChange, reason }: DistractionAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-destructive bg-destructive/5 text-destructive-foreground shadow-2xl shadow-destructive/50">
        <AlertDialogHeader>
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-destructive/20">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-3xl font-bold text-destructive">
            Distraction Detected!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg text-destructive/90">
            {reason}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className="w-full h-11 rounded-md px-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Get Back to Work
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
