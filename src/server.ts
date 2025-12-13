import express from 'express';
import cors from 'cors';
import http from 'http';
import { env } from './config/env';
import { requestLogger } from './utils/logger';
import healthRouter from './api/health';
import { startWebSocketService } from './services/ws';

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

const server = http.createServer(app);

startWebSocketService(server, {
  path: env.wsPath,
  authToken: env.wsAuthToken,
  rateLimitMs: env.wsRateLimitMs,
});

server.listen(env.httpPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${env.httpPort}`);
});
