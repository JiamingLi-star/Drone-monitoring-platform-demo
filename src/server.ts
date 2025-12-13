import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './utils/logger';
import healthRouter from './api/health';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(requestLogger());

app.use('/api', healthRouter);

app.get('/', (_req, res) => {
  res.send('Drone Monitoring Platform API');
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Basic error handler placeholder
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(env.httpPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${env.httpPort}`);
});
