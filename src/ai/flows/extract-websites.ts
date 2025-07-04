'use server';
/**
 * @fileOverview Extracts website domains from a natural language description of tools.
 *
 * - extractWebsites - A function that extracts website domains.
 * - ExtractWebsitesInput - The input type for the extractWebsites function.
 * - ExtractWebsitesOutput - The return type for the extractWebsites function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractWebsitesInputSchema = z.object({
  toolsDescription: z.string().describe('A natural language description of the tools and websites the user plans to use.'),
});
export type ExtractWebsitesInput = z.infer<typeof ExtractWebsitesInputSchema>;

const ExtractWebsitesOutputSchema = z.object({
  websites: z.array(z.string()).describe('A list of root domains (e.g., google.com, github.com) extracted from the description. Include common subdomains if relevant (e.g., docs.google.com).'),
});
export type ExtractWebsitesOutput = z.infer<typeof ExtractWebsitesOutputSchema>;

export async function extractWebsites(input: ExtractWebsitesInput): Promise<ExtractWebsitesOutput> {
  return extractWebsitesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractWebsitesPrompt',
  input: {schema: ExtractWebsitesInputSchema},
  output: {schema: ExtractWebsitesOutputSchema},
  prompt: `You are an AI assistant that helps users configure their focus sessions. Your task is to extract a list of relevant website domains from a user's description of the tools they need.

From the user's description below, identify the key websites, services, or applications they will use. For each, provide the root domain and any common subdomains. For example, if they say "Google Docs and my company's GitHub", you should extract "docs.google.com", "google.com", and "github.com". If they mention a specific app like "VS Code", you don't need to add a website unless they specify using a web version.

User's Description of Tools: {{{toolsDescription}}}

Output the list of domains in JSON format.
`,
});

const extractWebsitesFlow = ai.defineFlow(
  {
    name: 'extractWebsitesFlow',
    inputSchema: ExtractWebsitesInputSchema,
    outputSchema: ExtractWebsitesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
