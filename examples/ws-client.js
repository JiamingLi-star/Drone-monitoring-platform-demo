const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws';
const WS_TOKEN = process.env.WS_TOKEN || 'demo-token';

const socket = new WebSocket(WS_URL + `?token=${encodeURIComponent(WS_TOKEN)}`);

socket.on('open', () => {
  // eslint-disable-next-line no-console
  console.log('Connected to WebSocket server at', WS_URL);
});

socket.on('message', (data) => {
  try {
    const parsed = JSON.parse(data.toString());
    // eslint-disable-next-line no-console
    console.log('Received message:', parsed);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Received non-JSON payload:', data.toString());
  }
});

socket.on('close', (code, reason) => {
  // eslint-disable-next-line no-console
  console.log('Connection closed', code, reason.toString());
});

socket.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('WebSocket error', error.message);
});
