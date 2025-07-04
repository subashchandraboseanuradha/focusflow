import { config } from 'dotenv';
config();

import '@/ai/flows/detect-distraction.ts';
import '@/ai/flows/extract-websites.ts';
import '@/ai/flows/generate-focus-question.ts';
