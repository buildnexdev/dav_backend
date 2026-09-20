import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { uploadsRoot } from './config/paths.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsRoot, {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    res.set('Cache-Control', 'no-store');
  }
}));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === 'production' ? 200 : 1000,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/', (req, res) => {
  res.json({
    name: 'DAV Civil Services API',
    status: 'ok',
    docs: {
      health: 'GET /api/health',
      login: 'POST /api/auth/login',
      students: 'GET|POST /api/students'
    }
  });
});

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
