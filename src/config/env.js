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
  jwtSecret: process.env.JWT_SECRET || 'dav-civil-services-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    name: process.env.DB_NAME || 'dav_civil_services'
  },
  ai: {
    provider,
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || defaultModels[provider] || defaultModels.openai,
    temperature: Number(process.env.AI_TEMPERATURE ?? 0.3),
    maxTokens: Number(process.env.AI_MAX_TOKENS ?? 750)
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
    keySecret: process.env.RAZORPAY_KEY_SECRET || ''
  }
};
