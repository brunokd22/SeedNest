import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import nurseryRouter from './routes/nursery';
import categoryRouter from './routes/category';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRouter);

app.use(express.json());

app.use('/api/nurseries', nurseryRouter);
app.use('/api/nurseries/:nurseryId/categories', categoryRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
