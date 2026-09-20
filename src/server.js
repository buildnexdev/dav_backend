import { env } from './config/env.js';
import { initDatabase } from './db/init.js';
import app from './app.js';

try {
  await initDatabase();
  app.listen(env.port, () => {
    console.log(`DAV Civil Services API running on http://localhost:${env.port}`);
  });
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
