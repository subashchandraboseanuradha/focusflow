'use server';
/**
 * @fileOverview Generates a question to check if the user is focused on their task.
 *
 * - generateFocusQuestion - A function that generates a focus check-in question.
 * - GenerateFocusQuestionInput - The input type for the function.
 * - GenerateFocusQuestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFocusQuestionInputSchema = z.object({
  taskDescription: z.string().describe('The description of the current task.'),
});
export type GenerateFocusQuestionInput = z.infer<typeof GenerateFocusQuestionInputSchema>;

const GenerateFocusQuestionOutputSchema = z.object({
  question: z.string().describe('A short, encouraging question to check the user\'s progress on their task.'),
});
export type GenerateFocusQuestionOutput = z.infer<typeof GenerateFocusQuestionOutputSchema>;

export async function generateFocusQuestion(input: GenerateFocusQuestionInput): Promise<GenerateFocusQuestionOutput> {
  return generateFocusQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFocusQuestionPrompt',
  input: {schema: GenerateFocusQuestionInputSchema},
  output: {schema: GenerateFocusQuestionOutputSchema},
  prompt: `You are a friendly and encouraging productivity coach. Your goal is to help the user stay focused.

Based on the user's current task description, generate a single, short, and friendly question to check on their progress. The question should be specific to their task and sound encouraging.

Do not ask generic questions like "How is it going?". Instead, ask about a potential milestone or part of the task.

Example Task: 'Write a blog post about AI in marketing'
Good Question: 'Have you outlined the main points for your blog post yet?'

Example Task: 'Refactor the user authentication flow'
Good Question: 'How is the refactoring of the login component coming along?'

User's Task: {{{taskDescription}}}

Generate a question now.
`,
});

const generateFocusQuestionFlow = ai.defineFlow(
  {
    name: 'generateFocusQuestionFlow',
    inputSchema: GenerateFocusQuestionInputSchema,
    outputSchema: GenerateFocusQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
