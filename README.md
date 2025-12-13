# Drone Monitoring Platform Demo

Lightweight telemetry ingestion and visualization stack that exposes an HTTP API, WebSocket stream, and a React dashboard for UAV monitoring. Use the provided Docker Compose file to launch the API, WebSocket gateway, InfluxDB storage, and frontend in one step.

## Prerequisites

- Node.js 18+ and npm
- Docker + Docker Compose (for containerized usage)

## Quick start

```bash
make install
make start           # starts the API/WebSocket server on port 3000
npm run client:dev   # starts the Vite dev server on port 5173
```

Or run everything at once:

```bash
make dev             # runs API and frontend concurrently
```

### Local testing (Windows/PowerShell tips)

1. Ensure Node.js 18+ is installed (Node 22.x works; the npm warning about `@vitejs/plugin-react` is safe to ignore if Node is >=22.2.0).
2. If `make` is unavailable, you can run the equivalent npm scripts directly:
   ```pwsh
   npm install
   npm run start:server   # start API/WebSocket on port 3000
   npm run client:dev     # start Vite dev server on port 5173
   ```
   Or keep using `make start` / `make dev` from Git Bash or WSL if you prefer.
3. Send a sample telemetry request from PowerShell (no Bash required):
   ```pwsh
   ./scripts/curl-telemetry.ps1 -HostName localhost -Port 3000 -FilePath examples/telemetry.json
   ```
   You should see the JSON response echoed; use `-HostName`/`-Port` to point at a remote API.
4. Connect a WebSocket client to `ws://localhost:3000/ws?token=demo-token` to see live telemetry echoes.


### Using Docker Compose

```bash
make docker-up
```

This builds and starts:
- **api**: Node/Express server with WebSocket streaming
- **frontend**: Static React dashboard served by Nginx
- **influxdb**: Pre-configured InfluxDB 2.7 instance with sample data

Use `make docker-down` to stop and remove containers. Example line-protocol data is seeded from `examples/sample-lineprotocol.lp` via `examples/init-influx.sh`.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `HTTP_PORT` | `3000` | HTTP API listening port |
| `WS_PATH` | `/ws` | WebSocket upgrade path |
| `WS_AUTH_TOKEN` | `demo-token` | Token required via `Sec-WebSocket-Protocol` header or `?token=` query |
| `WS_RATE_LIMIT_MS` | `250` | Broadcast rate limit window |
| `CORS_ORIGIN` | `*` | Allowed CORS origin(s) |
| `INFLUX_HOST` | `localhost` | InfluxDB host |
| `INFLUX_PORT` | `8086` | InfluxDB port |
| `INFLUX_PROTOCOL` | `http` | InfluxDB protocol |
| `INFLUX_ORG` | `your-org` | InfluxDB organization |
| `INFLUX_BUCKET` | `your-bucket` | Target bucket for telemetry |
| `INFLUX_TOKEN` | `your-token` | InfluxDB token |

## HTTP API

- **Endpoint**: `POST /api/v1/uas/telemetry`
- **Content-Type**: `application/json`
- **Required fields**: `timestamp`, `latitude`, `longitude`, `trackStatus`
- **Optional fields**: `altitude`, `groundSpeed`, `heading`

Example payload lives in [`examples/telemetry.json`](examples/telemetry.json). Test with:

```bash
./scripts/curl-telemetry.sh
# or
HOST=127.0.0.1 PORT=4000 ./scripts/curl-telemetry.sh
```

Health check endpoint is available at `GET /api/health`.

## WebSocket stream

- **URL**: `ws://<host>:<port><WS_PATH>` (default `ws://localhost:3000/ws`)
- **Auth**: supply `Sec-WebSocket-Protocol: <WS_AUTH_TOKEN>` header or `?token=<WS_AUTH_TOKEN>` query param
- **Messages**:
  - Server sends `{ "type": "welcome", "timestamp": "..." }` on connect
  - Broadcast telemetry payloads arrive as `{ "type": "telemetry", "payload": { ... } }`

Example connection using Node/WebSocket:

```js
const ws = new WebSocket('ws://localhost:3000/ws?token=demo-token');
ws.onmessage = (event) => console.log(event.data);
```

## Frontend

The React dashboard (Vite) connects to the WebSocket stream and offers a simulation toggle. Configure the WebSocket URL via `VITE_WS_URL` (defaults to `ws://localhost:3000/ws?token=demo-token`).

Build and preview production assets:

```bash
npm run client:build
npm run client:preview -- --host 0.0.0.0 --port 4173
```

## Testing & quality

- **Backend/unit**: `npm test` (Node test runner with ts-node)
- **Frontend/unit**: `npm run test:client` (Vitest + Testing Library)
- **Type check**: `npm run lint`
- **Format**: `npm run format`

Make targets mirror these npm scripts for convenience.

## Sample data

- `examples/telemetry.json`: HTTP payload example
- `examples/sample-lineprotocol.lp`: InfluxDB line-protocol seeded in Docker Compose
- `examples/ws-client.js`: Minimal WebSocket consumer
