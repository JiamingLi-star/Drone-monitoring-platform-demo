# Drone Monitoring Platform Demo

This repository exposes a minimal HTTP entrypoint for drone (UAS) telemetry ingestion, plus an optional MQTT subscriber that reuses the same validation and processing pipeline.

## HTTP API

- **Endpoint**: `POST /api/v1/uas/telemetry`
- **Content-Type**: `application/json`
- **Required fields**:
  - `timestamp` (ISO 8601 string or epoch milliseconds)
  - `latitude` (decimal degrees between -90 and 90)
  - `longitude` (decimal degrees between -180 and 180)
  - `trackStatus` (non-empty string describing the flight/track state)
- **Optional fields**: `altitude`, `groundSpeed`, `heading`
- **Response shape**: `{ success: boolean, code?: number, errorCode?: string, errorMsg?: string, data?: object }`

Example request body lives in [`examples/telemetry.json`](examples/telemetry.json).

### Running the server

```bash
npm start
```

The server listens on `PORT` (default `3000`). Set `MQTT_BROKER_URL` and optional `MQTT_TOPIC` to enable MQTT subscription.

### Quick test with curl

```bash
./scripts/curl-telemetry.sh
```

Override the target host or port with environment variables:

```bash
HOST=127.0.0.1 PORT=4000 ./scripts/curl-telemetry.sh
```

## MQTT (optional)

If the `mqtt` package is available and `MQTT_BROKER_URL` is defined, the application will subscribe to the configured topic (default `uas/telemetry`) and feed messages through the same validation and processing pipeline used by the HTTP endpoint.
