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

export type TaskDetails = FormValues & { approvedWebsites: string[]; flowId?: string };

interface TaskSetupFormProps {
  onStartTask: (details: Omit<TaskDetails, 'flowId'>) => void;
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Error getting user:', userError);
        toast({
          variant: 'destructive',
          title: 'Authentication error',
          description: 'Failed to verify user authentication. Please sign in again.',
        });
        setIsProcessing(false);
        return;
      }
      
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
      console.log('🔍 User email:', user.email);
      console.log('🔍 User role:', user.role);
      console.log('🔍 User app metadata:', user.app_metadata);
      console.log('🔍 User user metadata:', user.user_metadata);
      
      // Check session validity
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        toast({
          variant: 'destructive',
          title: 'Session Error',
          description: 'Authentication session is invalid. Please sign in again.',
        });
        setIsProcessing(false);
        return;
      }
      
      if (!session?.session) {
        console.error('❌ No active session found');
        toast({
          variant: 'destructive',
          title: 'No Active Session',
          description: 'No active authentication session. Please sign in again.',
        });
        setIsProcessing(false);
        return;
      }
      
      console.log('✅ Active session found:', session.session.access_token ? 'Access token present' : 'No access token');
      
      // Run simple database test first
      const isDbWorking = await testDatabaseConnection();
      if (!isDbWorking) {
        toast({
          variant: 'destructive',
          title: 'Database Connection Failed',
          description: 'Unable to connect to the database. Please check the console for details.',
        });
        setIsProcessing(false);
        return;
      }
      
      // Test database connection
      console.log('🔗 Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('flows')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('❌ Database connection test failed:', testError);
        console.error('  Test error message:', testError.message);
        console.error('  Test error code:', testError.code);
        console.error('  Test error details:', testError.details);
        
        // If we can't even connect to the flows table, show specific error
        toast({
          variant: 'destructive',
          title: 'Database Connection Error',
          description: `Cannot connect to database: ${testError.message}. Please check DATABASE_SETUP.md for troubleshooting steps.`,
        });
        setIsProcessing(false);
        return;
      } else {
        console.log('✅ Database connection test successful');
      }
      
      // Simple test function to verify database connectivity
      async function testDatabaseConnection() {
        console.log('🧪 Testing simple database connection...');
        try {
          const { data, error } = await supabase
            .from('flows')
            .select('*')
            .limit(1);
          
          console.log('🧪 Simple test result:', { data, error });
          if (error) {
            console.error('🧪 Simple test failed:', error);
            return false;
          }
          console.log('🧪 Simple test passed');
          return true;
        } catch (err) {
          console.error('🧪 Simple test exception:', err);
          return false;
        }
      }

      // Check table structure
      console.log('📋 Checking table structure...');
      const { data: schemaData, error: schemaError } = await supabase
        .from('flows')
        .select('id, user_id, task_description, allowed_urls, status, start_time, end_time')
        .limit(1); // Get one record to verify all columns exist
        
      if (schemaError) {
        console.error('❌ Schema check failed:', schemaError);
        console.error('  Schema error message:', schemaError.message);
        console.error('  Schema error code:', schemaError.code);
        
        toast({
          variant: 'destructive',
          title: 'Database Schema Error',
          description: `Database table structure is incorrect: ${schemaError.message}. Please run database migrations.`,
        });
        setIsProcessing(false);
        return;
      } else {
        console.log('✅ Table structure validation successful');
      }
      
      // Test user permissions by trying a simple select
      console.log('🔐 Testing user permissions...');
      const { data: permData, error: permError } = await supabase
        .from('flows')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
        
      if (permError) {
        console.error('❌ Permission test failed:', permError);
        console.error('  Permission error message:', permError.message);
        console.error('  Permission error code:', permError.code);
        
        if (permError.message?.includes('RLS') || permError.message?.includes('policy')) {
          toast({
            variant: 'destructive',
            title: 'Database Permission Error',
            description: 'Row Level Security policy error. Please check your account permissions.',
          });
          setIsProcessing(false);
          return;
        }
      } else {
        console.log('✅ User permissions test successful');
      }
       // Add retry logic for schema cache issues
      let insertAttempt = 0;
      const maxRetries = 3;
      let lastError = null;
      let insertData = null;
      // Prepare the data to insert
      const flowData = {
        user_id: user.id,
        task_description: values.description,
        allowed_urls: websites,
        start_time: new Date().toISOString(),
        end_time: new Date(new Date().getTime() + values.time * 60000).toISOString(),
        status: 'active' as const
      };
      
      console.log('💾 Inserting flow data into Supabase:', flowData);
      
      // Validate the data before insertion
      if (!flowData.user_id) {
        console.error('❌ No user ID available for insertion');
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'User ID is missing. Please sign in again.',
        });
        setIsProcessing(false);
        return;
      }
      
      if (!flowData.task_description || flowData.task_description.trim().length === 0) {
        console.error('❌ Task description is empty');
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Task description cannot be empty.',
        });
        setIsProcessing(false);
        return;
      }
      
      if (!flowData.allowed_urls || flowData.allowed_urls.length === 0) {
        console.error('❌ No allowed URLs provided');
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'At least one allowed website must be specified.',
        });
        setIsProcessing(false);
        return;
      }

      // Retry logic for potential schema cache issues
      while (insertAttempt < maxRetries) {
        insertAttempt++;
        console.log(`🔄 Insert attempt ${insertAttempt}/${maxRetries}`);
        
        const { data, error } = await supabase
          .from('flows')
          .insert([flowData])
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
          onStartTask({ ...values, approvedWebsites: websites });
          return;
        }

        lastError = error;
        
        // Enhanced error logging
        console.error(`❌ Attempt ${insertAttempt} failed:`);
        console.error('  Error object:', error);
        console.error('  Error message:', error?.message);
        console.error('  Error code:', error?.code);
        console.error('  Error details:', error?.details);
        console.error('  Error hint:', error?.hint);
        
        // Try to stringify safely
        try {
          console.error('  Error JSON:', JSON.stringify(error, null, 2));
        } catch (stringifyError) {
          console.error('  Error could not be stringified:', stringifyError);
          console.error('  Error keys:', Object.keys(error || {}));
        }

        // If it's a schema cache issue, wait a bit and retry
        if (error?.message?.includes('schema cache') || error?.message?.includes('user_id')) {
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
        console.error('❌ Final Supabase error handling:');
        console.error('  Message:', error?.message || 'Unknown error');
        console.error('  Code:', error?.code);
        console.error('  Details:', error?.details);
        console.error('  Hint:', error?.hint);
        
        let errorMessage = 'There was an issue starting the flow. Please try again.';
        
        // Handle specific error cases
        if (!error) {
          errorMessage = 'Unknown error occurred during database operation.';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'Please sign in to start a focus session.';
        } else if (error.code === '42P01') {
          errorMessage = 'Database table "flows" does not exist. Please run migrations.';
        } else if (error.code === 'PGRST301') {
          errorMessage = 'Insufficient permissions. Please check your account access.';
        } else if (error.code === 'PGRST100') {
          errorMessage = 'Database query syntax error. This may indicate a database schema issue.';
        } else if (error.code === 'PGRST102') {
          errorMessage = 'Database table or column not found. Please run migrations.';
        } else if (error.code === 'PGRST103') {
          errorMessage = 'Database permission denied. Please check Row Level Security policies.';
        } else if (error.message?.includes('user_id') && error.message?.includes('schema cache')) {
          errorMessage = 'Database connection issue detected. Please refresh the page and try again. If the problem persists, the database may need to be reset.';
        } else if (error.message?.includes('relation "flows" does not exist')) {
          errorMessage = 'Database table missing. Please run migrations or contact support.';
        } else if (error.message?.includes('permission denied')) {
          errorMessage = 'Insufficient permissions. Please check your account status.';
        } else if (error.message?.includes('Could not find')) {
          errorMessage = 'Database schema error. Please refresh the page or contact support if the issue persists.';
        } else if (error.message?.includes('JWT')) {
          errorMessage = 'Authentication token expired. Please sign in again.';
        } else if (error.message?.includes('RLS')) {
          errorMessage = 'Database security policy error. Please contact support.';
        } else if (insertAttempt >= maxRetries && error.message?.includes('user_id')) {
          errorMessage = `Failed to start session after ${maxRetries} attempts. This appears to be a database schema issue. Please refresh the page and try again.`;
        } else if (error.message) {
          errorMessage = `Database error: ${error.message}`;
        }
        
        console.error('🚨 Final error message shown to user:', errorMessage);
        
        toast({
          variant: 'destructive',
          title: 'Error starting flow',
          description: errorMessage,
        });
        setIsProcessing(false);
        return;
      }
      
    } catch (error) {
      console.error('💥 Fatal error in task submission:');
      console.error('  Error object:', error);
      console.error('  Error type:', typeof error);
      
      if (error instanceof Error) {
        console.error('  Error name:', error.name);
        console.error('  Error message:', error.message);
        console.error('  Error stack:', error.stack);
      }
      
      // Try to safely log the error object
      try {
        console.error('  Full error JSON:', JSON.stringify(error, null, 2));
      } catch (stringifyError) {
        console.error('  Error could not be stringified:', stringifyError);
        console.error('  Error keys:', Object.keys(error || {}));
        console.error('  Error constructor:', error?.constructor?.name);
      }
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast({
          variant: 'destructive',
          title: 'Network Error',
          description: 'Unable to connect to the service. Please check your internet connection and try again.',
        });
      } else if (error instanceof Error && error.message.includes('AI')) {
        toast({
          variant: 'destructive',
          title: 'AI Service Error',
          description: 'There was an issue with the AI service. Please try again in a moment.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Processing Request',
          description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        });
      }
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
                          className="min-h-[100px] text-base leading-relaxed border-2 border-border bg-card hover:border-muted-foreground focus:border-primary focus:bg-background shadow-sm hover:shadow-md transition-all duration-300" 
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
                          className="min-h-[100px] text-base leading-relaxed border-2 border-border bg-card hover:border-muted-foreground focus:border-primary focus:bg-background shadow-sm hover:shadow-md transition-all duration-300"
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
                            className="w-32 text-base border-2 border-border bg-card hover:border-muted-foreground focus:border-primary focus:bg-background shadow-sm hover:shadow-md transition-all duration-300" 
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
