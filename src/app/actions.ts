// src/app/actions.ts
'use server';

import { detectDistraction, type DetectDistractionInput, type DetectDistractionOutput } from '@/ai/flows/detect-distraction';
import { extractWebsites, type ExtractWebsitesInput } from '@/ai/flows/extract-websites';
import { generateFocusQuestion, type GenerateFocusQuestionInput, type GenerateFocusQuestionOutput } from '@/ai/flows/generate-focus-question';
import { createServerComponentClient } from '@/lib/supabase-server';

export async function checkDistractionAction(input: DetectDistractionInput): Promise<DetectDistractionOutput> {
  try {
    const result = await detectDistraction(input);
    return result;
  } catch (error) {
    console.error('Error in checkDistractionAction:', error);
    return {
      isDistracted: false,
      distractionReason: 'Could not check activity due to an AI service error.',
    };
  }
}

export async function extractWebsitesAction(input: ExtractWebsitesInput): Promise<string[]> {
    try {
        const result = await extractWebsites(input);
        return result.websites;
    } catch (error) {
        console.error('Error in extractWebsitesAction:', error);
        // Return an empty array or handle the error as needed
        return [];
    }
}

export async function generateFocusQuestionAction(input: GenerateFocusQuestionInput): Promise<GenerateFocusQuestionOutput> {
    try {
        const result = await generateFocusQuestion(input);
        return result;
    } catch (error) {
        console.error('Error in generateFocusQuestionAction:', error);
        return {
            question: 'Are you staying on task?',
        };
    }
}

export async function updateFlowStatusAction(flowId: string, status: 'completed' | 'abandoned', actualEndTime?: Date): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerComponentClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Update the flow with new status and actual end time
    const updateData: any = {
      status,
      end_time: actualEndTime || new Date(),
    };

    const { error } = await supabase
      .from('flows')
      .update(updateData)
      .eq('id', flowId)
      .eq('user_id', user.id); // Ensure user can only update their own flows

    if (error) {
      console.error('Error updating flow status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateFlowStatusAction:', error);
    return { success: false, error: 'Unknown error occurred' };
  }
}
