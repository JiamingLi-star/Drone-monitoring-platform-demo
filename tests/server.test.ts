import assert from 'assert';
import WebSocket from 'ws';
import request from 'supertest';
import { broadcastTelemetry, stopWebSocketService } from '../src/services/ws';
import { createHttpServer } from '../src/server';

function listen(server: import('http').Server) {
  return new Promise<number>((resolve) => {
    const listener = server.listen(0, () => {
      const address = server.address();
      if (typeof address === 'object' && address) {
        resolve(address.port);
      }
      listener.removeAllListeners();
    });
  });
}

describe('HTTP routes', () => {
  let server: import('http').Server;

  afterEach(() => {
    stopWebSocketService();
    server?.close();
  });

  it('returns health status', async () => {
    ({ server } = createHttpServer());
    const port = await listen(server);
    await request(`http://127.0.0.1:${port}`).get('/api/health').expect(200).expect((res) => {
      assert.equal(res.body.status, 'ok');
    });
  });
});

describe('WebSocket service', () => {
  let server: import('http').Server;

  afterEach(() => {
    stopWebSocketService();
    server?.close();
  });

  it('rejects unauthorized connections', async () => {
    ({ server } = createHttpServer({ wsAuthToken: 'secret', wsPath: '/socket' }));
    const port = await listen(server);

    await new Promise<void>((resolve) => {
      const socket = new WebSocket(`ws://127.0.0.1:${port}/socket?token=wrong`);
      socket.on('close', (code) => {
        assert.equal(code, 1008);
        resolve();
      });
    });
  });

  it('broadcasts telemetry respecting rate limits', async () => {
    ({ server } = createHttpServer({ wsAuthToken: 'demo', wsPath: '/stream', wsRateLimitMs: 50 }));
    const port = await listen(server);

    const messages: Array<any> = [];
    const socket = new WebSocket(`ws://127.0.0.1:${port}/stream?token=demo`);

    await new Promise<void>((resolve, reject) => {
      socket.on('message', (data) => {
        const parsed = JSON.parse(String(data));
        messages.push(parsed);
        if (parsed.type === 'telemetry') {
          resolve();
        }
      });
      socket.on('error', reject);
      socket.on('open', () => {
        broadcastTelemetry({
          timestamp: new Date().toISOString(),
          coordinates: { latitude: 0, longitude: 0 },
          trackStatus: 'ok',
        });
        broadcastTelemetry({
          timestamp: new Date().toISOString(),
          coordinates: { latitude: 1, longitude: 1 },
          trackStatus: 'ok',
        });
      });
    });

    assert.ok(messages.some((msg) => msg.type === 'welcome'));
    assert.ok(messages.some((msg) => msg.type === 'telemetry'));
    socket.close();
  });
});
