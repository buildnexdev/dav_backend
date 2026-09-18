import { env } from '../config/env.js';

export function getHealth(req, res) {
  res.json({
    status: 'online',
    assistant: "Nandha Kumar's Personal Portfolio API",
    version: '1.0.0',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString()
  });
}
