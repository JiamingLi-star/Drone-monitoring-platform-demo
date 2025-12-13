import http from 'http';
import { env } from './config/env';
import { createApp } from './app';
import { startWebSocketService, stopWebSocketService } from './services/ws';

export interface ServerOptions {
  port?: number;
  wsPath?: string;
  wsAuthToken?: string;
  wsRateLimitMs?: number;
}

export function createHttpServer(options: ServerOptions = {}) {
  const app = createApp();
  const server = http.createServer(app);

  startWebSocketService(server, {
    path: options.wsPath ?? env.wsPath,
    authToken: options.wsAuthToken ?? env.wsAuthToken,
    rateLimitMs: options.wsRateLimitMs ?? env.wsRateLimitMs,
  });

  return { app, server };
}

export function startServer(options: ServerOptions = {}) {
  const { server } = createHttpServer(options);
  const port = options.port ?? env.httpPort;
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
  return server;
}

export function stopServer(server: http.Server) {
  stopWebSocketService();
  server.close();
}

if (require.main === module) {
  startServer();
}
