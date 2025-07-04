// src/ai/flows/detect-distraction.ts
'use server';

/**
 * @fileOverview Detects if the user is distracted based on current activity and approved websites.
 *
 * - detectDistraction - A function that detects user distraction.
 * - DetectDistractionInput - The input type for the detectDistraction function.
 * - DetectDistractionOutput - The return type for the detectDistraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectDistractionInputSchema = z.object({
  currentActivity: z.string().describe('The currently active application or website.'),
  approvedWebsites: z.array(z.string()).describe('A list of approved websites for the current task.'),
  taskDescription: z.string().describe('A description of the current task.'),
});
export type DetectDistractionInput = z.infer<typeof DetectDistractionInputSchema>;

const DetectDistractionOutputSchema = z.object({
  isDistracted: z.boolean().describe('Whether the user is distracted from the current task.'),
  distractionReason: z.string().describe('The reason for the distraction, if any.'),
});
export type DetectDistractionOutput = z.infer<typeof DetectDistractionOutputSchema>;

export async function detectDistraction(input: DetectDistractionInput): Promise<DetectDistractionOutput> {
  return detectDistractionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectDistractionPrompt',
  input: {schema: DetectDistractionInputSchema},
  output: {schema: DetectDistractionOutputSchema},
  prompt: `You are an AI assistant that helps users stay focused on their tasks.

You will be given the user's current activity (application or website), a list of approved websites for the current task, and a description of the task.

Your job is to determine if the user is distracted from their task. If the user is on an unapproved website, or using an application unrelated to the task, you should set isDistracted to true and provide a reason for the distraction.

If the user is on an approved website or using an application related to the task, you should set isDistracted to false and the reason for the distraction to "".

Current Task: {{{taskDescription}}}
Approved Websites: {{#each approvedWebsites}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Current Activity: {{{currentActivity}}}

Output in JSON format:
`,
});

const detectDistractionFlow = ai.defineFlow(
  {
    name: 'detectDistractionFlow',
    inputSchema: DetectDistractionInputSchema,
    outputSchema: DetectDistractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
