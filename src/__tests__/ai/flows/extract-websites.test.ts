import { extractWebsites } from '../../../ai/flows/extract-websites';

// Mock the @/ai/genkit module
jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn(() => ({
      // Mock the prompt function returned by definePrompt
      prompt: jest.fn(async (input: any) => {
        // Simulate LLM response based on input
        if (input.toolsDescription.includes('Google Docs') && input.toolsDescription.includes('Confluence')) {
          return {
            output: {
              websites: ['docs.google.com', 'google.com', 'confluence.com']
            }
          };
        } else if (input.toolsDescription.includes('GitHub')) {
          return {
            output: {
              websites: ['github.com']
            }
          };
        }
        return {
          output: {
            websites: []
          }
        };
      }),
    })),
  },
}));

describe('extractWebsites', () => {
  it('should extract websites correctly from a description', async () => {
    const input = {
      toolsDescription: 'I will be using Google Docs to write and referring to our company wiki on Confluence for research.'
    };
    const result = await extractWebsites(input);
    expect(result.websites).toEqual(['docs.google.com', 'google.com', 'confluence.com']);
  });

  it('should return an empty array if no websites are found', async () => {
    const input = {
      toolsDescription: 'I will be using a pen and paper.'
    };
    const result = await extractWebsites(input);
    expect(result.websites).toEqual([]);
  });

  it('should handle single website descriptions', async () => {
    const input = {
      toolsDescription: 'I will be working on my project on GitHub.'
    };
    const result = await extractWebsites(input);
    expect(result.websites).toEqual(['github.com']);
  });
});
