const { writeTelemetryPoint } = require('./influx');
const { broadcastTelemetry } = require('./ws.ts');

/**
 * Handle validated telemetry payload. Hook to downstream pipelines, logs, or storage.
 * @param {import('../types/telemetry.js').TelemetryPayload} payload
 * @returns {{message: string}}
 */
function processTelemetry(payload) {
  // For this demo, we simply log the message. Replace with persistence or queueing as needed.
  const normalizedTimestamp = typeof payload.timestamp === 'number'
    ? new Date(payload.timestamp).toISOString()
    : new Date(payload.timestamp).toISOString();

  // eslint-disable-next-line no-console
  console.log('[telemetry]', normalizedTimestamp, JSON.stringify(payload));

  const inflightWrite = writeTelemetryPoint({
    ...payload,
    course: payload.heading,
  });

  inflightWrite.catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to persist telemetry to InfluxDB:', error.message);
  });

  broadcastTelemetry({
    timestamp: normalizedTimestamp,
    coordinates: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      altitude: payload.altitude,
    },
    trackStatus: payload.trackStatus,
    motion: {
      groundSpeed: payload.groundSpeed,
      heading: payload.heading,
    },
    identifiers: {
      orderId: payload.orderId,
      sn: payload.sn,
      flightCode: payload.flightCode,
      manufacturerId: payload.manufacturerId,
    },
    power: {
      level: payload.batteryLevel,
      voltage: payload.batteryVoltage,
      temperature: payload.batteryTemperature,
      status: payload.batteryStatus,
    },
    weather: {
      temperature: payload.temperature,
      humidity: payload.humidity,
      windSpeed: payload.windSpeed,
      windDirection: payload.windDirection,
      visibility: payload.visibility,
      pressure: payload.pressure,
    },
  });
  return { message: 'Telemetry accepted for processing' };
}

module.exports = { processTelemetry };
