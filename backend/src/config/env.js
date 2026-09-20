import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const defaultModels = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  groq: 'llama-3.1-8b-instant'
};

const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  ai: {
    provider,
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || defaultModels[provider] || defaultModels.openai,
    temperature: Number(process.env.AI_TEMPERATURE ?? 0.3),
    maxTokens: Number(process.env.AI_MAX_TOKENS ?? 750)
  }
};
