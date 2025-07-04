'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, Loader2, History, Hourglass } from 'lucide-react';
import { extractWebsitesAction } from '@/app/actions';
import { createClientComponentClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { TaskPreset } from './focus-flow-dashboard';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';

const supabase = createClientComponentClient();

const formSchema = z.object({
  description: z.string().min(10, 'Please provide a more detailed task description.'),
  approvedToolsDescription: z.string().min(10, 'Please describe the tools and websites you need.'),
  time: z.coerce.number().min(1, 'Task must be at least 1 minute long.').max(240, 'Task cannot exceed 240 minutes.'),
});

type FormValues = z.infer<typeof formSchema>;

export type TaskDetails = FormValues & { approvedWebsites: string[]; flowId: string };

interface TaskSetupFormProps {
  onStartTask: (details: TaskDetails) => void;
  presets: FormValues[];
  isLoadingPresets: boolean;
}

export function TaskSetupForm({ onStartTask, presets, isLoadingPresets }: TaskSetupFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      approvedToolsDescription: '',
      time: 30,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsProcessing(true);
    
    console.log('🚀 Starting task submission with values:', values);
    console.log('📝 Tools description being sent to LLM:', values.approvedToolsDescription);
    
    try {
      console.log('🤖 Calling extractWebsitesAction...');
      const startTime = Date.now();
      
      const websites = await extractWebsitesAction({
        toolsDescription: values.approvedToolsDescription,
      });
      
      const endTime = Date.now();
      console.log(`⏱️ LLM processing took: ${endTime - startTime}ms`);
      console.log('🌐 Extracted websites from LLM:', websites);
      console.log('📊 Number of websites found:', websites.length);

      if (websites.length === 0) {
        console.warn('⚠️ No websites found by LLM');
        toast({
          variant: 'destructive',
          title: 'No websites found',
          description: 'The AI could not identify any websites from your description. Please be more specific.',
        });
        setIsProcessing(false);
        return;
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user found');
        toast({
          variant: 'destructive',
          title: 'Authentication required',
          description: 'Please sign in to start a focus session.',
        });
        setIsProcessing(false);
        return;
      }

      console.log('🔍 Current user:', user.id);
       // Add retry logic for schema cache issues
      let insertAttempt = 0;
      const maxRetries = 3;
      let lastError = null;
      let insertData = null;
      
      console.log('💾 Inserting flow data into Supabase:', {
        user_id: user.id,
        task_description: values.description,
        allowed_urls: websites,
        start_time: new Date(),
        end_time: new Date(new Date().getTime() + values.time * 60000),
        status: 'active'
      });

      // Retry logic for potential schema cache issues
      while (insertAttempt < maxRetries) {
        insertAttempt++;
        console.log(`🔄 Insert attempt ${insertAttempt}/${maxRetries}`);
        
        const { data, error } = await supabase
          .from('flows')
          .insert([
            {
              user_id: user.id,
              task_description: values.description,
              allowed_urls: websites,
              start_time: new Date(),
              end_time: new Date(new Date().getTime() + values.time * 60000),
              status: 'active'
            },
          ])
          .select();

        if (!error) {
          insertData = data;
          console.log('✅ Successfully inserted flow data:', insertData);
          
          const flowId = insertData[0]?.id;
          if (!flowId) {
            console.error('❌ No flow ID returned from database');
            toast({
              variant: 'destructive',
              title: 'Error starting flow',
              description: 'Failed to get flow ID from database.',
            });
            setIsProcessing(false);
            return;
          }
          
          console.log('🎯 Final task details being passed to onStartTask:', { ...values, approvedWebsites: websites, flowId });
          onStartTask({ ...values, approvedWebsites: websites, flowId });
          return;
        }

        lastError = error;
        console.error(`❌ Attempt ${insertAttempt} failed:`, error);

        // If it's a schema cache issue, wait a bit and retry
        if (error.message?.includes('schema cache') || error.message?.includes('user_id')) {
          if (insertAttempt < maxRetries) {
            console.log(`⏳ Waiting before retry (schema cache issue detected)...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * insertAttempt));
            continue;
          }
        } else {
          // For other errors, don't retry
          break;
        }
      }

      // Handle the final error after all retries
      const error = lastError;

      if (error) {
        console.error('❌ Supabase error:', error.message || 'Unknown Supabase error');
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error hint:', error.hint);
        
        let errorMessage = 'There was an issue starting the flow. Please try again.';
        
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          errorMessage = 'Please sign in to start a focus session.';
        } else if (error.message?.includes('user_id') && error.message?.includes('schema cache')) {
          errorMessage = 'Database connection issue detected. Please refresh the page and try again. If the problem persists, the database may need to be reset.';
        } else if (error.message?.includes('relation "flows" does not exist')) {
          errorMessage = 'Database table missing. Please run migrations or contact support.';
        } else if (error.message?.includes('permission denied')) {
          errorMessage = 'Insufficient permissions. Please check your account status.';
        } else if (error.message?.includes('Could not find')) {
          errorMessage = 'Database schema error. Please refresh the page or contact support if the issue persists.';
        } else if (insertAttempt >= maxRetries && error.message?.includes('user_id')) {
          errorMessage = `Failed to start session after ${maxRetries} attempts. This appears to be a database schema issue. Please refresh the page and try again.`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          variant: 'destructive',
          title: 'Error starting flow',
          description: errorMessage,
        });
        setIsProcessing(false);
        return;
      }
      
    } catch (error) {
      console.error('💥 Fatal error in task submission:', error);
      console.error('💥 Error type:', typeof error);
      
      if (error instanceof Error) {
        console.error('💥 Error name:', error.name);
        console.error('💥 Error message:', error.message);
        console.error('💥 Error stack:', error.stack);
      }
      
      console.error('💥 Full error object:', JSON.stringify(error, null, 2));
      
      toast({
          variant: 'destructive',
          title: 'Error Processing Request',
          description: 'There was an issue with the AI service. Please try again.',
      });
    } finally {
        console.log('🏁 Task submission process completed, setting isProcessing to false');
        setIsProcessing(false);
    }
  }
  
  const handlePresetClick = (preset: TaskPreset) => {
    form.reset(preset);
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-6">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Define Your Focus Session</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Set your task, approved sites, and duration to begin a productive session.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          {(isLoadingPresets || presets.length > 0) && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-card px-4 py-1 text-muted-foreground font-medium rounded-full">
                    Quick Start from History
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <History className="h-4 w-4 text-primary" />
                  Recent Focus Sessions
                </div>
                
                <Card className="border-muted/50 bg-muted/20">
                  <CardContent className="p-3">
                    {isLoadingPresets ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </div>
                    ) : (
                      <ScrollArea className="h-36">
                        <div className="space-y-2 pr-2">
                          {presets.map((preset, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              className="w-full justify-between h-auto py-3 px-4 text-left hover:bg-accent/50 border border-transparent hover:border-accent/20 hover:shadow-sm transition-all duration-300 rounded-lg group"
                              onClick={() => handlePresetClick(preset)}
                            >
                              <span className="flex-1 font-medium text-sm break-words whitespace-normal leading-relaxed group-hover:text-accent-foreground transition-colors">
                                {preset.description}
                              </span>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 pl-3 bg-muted/30 group-hover:bg-accent/80 group-hover:text-accent-foreground px-2 py-1 rounded-md transition-all duration-300">
                                <Hourglass className="h-3 w-3" />
                                {preset.time}m
                              </div>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-card px-4 py-1 text-muted-foreground font-medium rounded-full">
                  Create New Session
                </span>
              </div>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold text-foreground">Task Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., 'Drafting the quarterly report for Q3 performance analysis'" 
                          className="min-h-[100px] text-base leading-relaxed border-muted hover:border-muted-foreground focus:border-primary transition-colors duration-300" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="approvedToolsDescription"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold text-foreground">Approved Tools & Websites</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., 'I will be using Google Docs to write and referring to our company wiki on Confluence for research.'" 
                          className="min-h-[100px] text-base leading-relaxed border-muted hover:border-muted-foreground focus:border-primary transition-colors duration-300"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-muted-foreground leading-relaxed">
                        Describe the websites or apps you need in plain English. Our AI will automatically identify the domains for you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold text-foreground">Focus Duration</FormLabel>
                      <div className="flex items-center space-x-3">
                        <FormControl>
                          <Input 
                            type="number" 
                            className="w-32 text-base border-muted hover:border-muted-foreground focus:border-primary transition-colors duration-300" 
                            {...field} 
                          />
                        </FormControl>
                        <span className="text-sm text-muted-foreground font-medium">minutes</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-base py-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                  size="lg" 
                  disabled={isProcessing}
                >
                  <div className="flex items-center gap-3">
                    {isProcessing ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <PlayCircle className="h-5 w-5" />
                    )}
                    <span>{isProcessing ? 'Analyzing & Preparing...' : 'Start Focus Session'}</span>
                  </div>
                </Button>
              </div>
            </form>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
