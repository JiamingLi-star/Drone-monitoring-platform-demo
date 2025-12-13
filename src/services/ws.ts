import { IncomingMessage } from 'http';
import { parse } from 'url';
import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

export interface BroadcastTelemetryMessage {
  timestamp: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  trackStatus: string;
  motion?: {
    groundSpeed?: number;
    heading?: number;
  };
  identifiers?: {
    flightCode?: string;
    manufacturerId?: string;
    orderId?: string;
    sn?: string;
  };
  power?: {
    level?: number;
    voltage?: number;
    temperature?: number;
    status?: string;
  };
  weather?: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    visibility?: number;
    pressure?: number;
  };
}

interface WebSocketOptions {
  authToken: string;
  heartbeatInterval: number;
  rateLimitMs: number;
  path: string;
}

type ClientMeta = {
  lastSeen: number;
  lastSent: number;
};

const clients = new Map<WebSocket, ClientMeta>();
let wsServer: WebSocketServer | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let pendingPayload: BroadcastTelemetryMessage | null = null;
let lastBroadcastAt = 0;

const defaultOptions: WebSocketOptions = {
  authToken: process.env.WS_AUTH_TOKEN || 'demo-token',
  heartbeatInterval: 30000,
  rateLimitMs: Number(process.env.WS_RATE_LIMIT_MS || 250),
  path: '/ws',
};
let currentOptions: WebSocketOptions = defaultOptions;

/**
 * Start a WebSocket service upgrading the provided HTTP server.
 */
export function startWebSocketService(server: HttpServer, options: Partial<WebSocketOptions> = {}) {
  if (wsServer) return wsServer;

  const mergedOptions: WebSocketOptions = {
    ...defaultOptions,
    ...options,
    authToken: options.authToken ?? defaultOptions.authToken,
    heartbeatInterval: options.heartbeatInterval ?? defaultOptions.heartbeatInterval,
    rateLimitMs: options.rateLimitMs ?? defaultOptions.rateLimitMs,
    path: options.path ?? defaultOptions.path,
  };
  currentOptions = mergedOptions;

  wsServer = new WebSocketServer({ server, path: mergedOptions.path });

  wsServer.on('connection', (socket, request) => {
    if (!isAuthorized(request, mergedOptions.authToken)) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    socket.isAlive = true;
    clients.set(socket, { lastSeen: Date.now(), lastSent: 0 });

    socket.on('pong', () => markAlive(socket));
    socket.on('close', () => clients.delete(socket));

    socket.send(JSON.stringify({ type: 'welcome', timestamp: new Date().toISOString() }));
  });

  const heartbeat = setInterval(() => {
    for (const [socket, meta] of clients.entries()) {
      if (!socket.isAlive) {
        socket.terminate();
        clients.delete(socket);
      } else {
        socket.isAlive = false;
        meta.lastSeen = Date.now();
        socket.ping();
      }
    }
  }, mergedOptions.heartbeatInterval);

  wsServer.on('close', () => clearInterval(heartbeat));
  return wsServer;
}

/**
 * Broadcast telemetry to all connected clients with simple rate limiting/debounce.
 */
export function broadcastTelemetry(payload: BroadcastTelemetryMessage) {
  if (!wsServer || wsServer.clients.size === 0) return;

  const now = Date.now();
  const elapsed = now - lastBroadcastAt;

  if (elapsed < currentOptions.rateLimitMs) {
    pendingPayload = payload;
    if (!debounceTimer) {
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (pendingPayload) {
          dispatchPayload(pendingPayload);
          pendingPayload = null;
        }
      }, currentOptions.rateLimitMs - elapsed);
    }
    return;
  }

  dispatchPayload(payload);
}

function dispatchPayload(payload: BroadcastTelemetryMessage) {
  lastBroadcastAt = Date.now();
  const serialized = JSON.stringify({ type: 'telemetry', payload });

  for (const socket of wsServer?.clients || []) {
    const meta = clients.get(socket);
    if (socket.readyState === WebSocket.OPEN && meta) {
      const now = Date.now();
      if (now - meta.lastSent < currentOptions.rateLimitMs) continue;
      meta.lastSent = now;
      socket.send(serialized);
    }
  }
}

function markAlive(socket: WebSocket & { isAlive?: boolean }) {
  socket.isAlive = true;
}

function isAuthorized(request: IncomingMessage, token: string) {
  if (!token) return true;
  const url = parse(request.url || '', true);
  const headerToken = request.headers['sec-websocket-protocol'];
  const queryToken = typeof url.query.token === 'string' ? url.query.token : undefined;
  return headerToken === token || queryToken === token;
}

declare module 'ws' {
  interface WebSocket {
    isAlive?: boolean;
  }
}

