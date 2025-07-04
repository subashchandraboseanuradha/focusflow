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
import { HelpCircle } from 'lucide-react';

interface FocusCheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  onConfirm: () => void;
  onDistracted: () => void;
}

export function FocusCheckinDialog({
  open,
  onOpenChange,
  question,
  onConfirm,
  onDistracted,
}: FocusCheckinDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
            <HelpCircle className="h-10 w-10 text-accent" />
          </div>
          <AlertDialogTitle className="text-center text-3xl font-bold">
            Focus Check-in
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg">
            {question}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AlertDialogAction
                className="w-full h-11 rounded-md px-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onDistracted}
            >
                I Got Distracted
            </AlertDialogAction>
            <AlertDialogAction
                className="w-full h-11 rounded-md px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={onConfirm}
            >
                I'm On Task!
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
