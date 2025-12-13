const { writeTelemetryPoint } = require('./influx');

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
  return { message: 'Telemetry accepted for processing' };
}

module.exports = { processTelemetry };
