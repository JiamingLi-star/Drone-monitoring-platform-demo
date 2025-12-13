const REQUIRED_FIELDS = ['timestamp', 'latitude', 'longitude', 'trackStatus'];

/**
 * Validate telemetry payload structure and required fields.
 * @param {unknown} body
 * @returns {{valid: boolean, errors: string[], payload?: import('../types/telemetry.js').TelemetryPayload}}
 */
function validateTelemetry(body) {
  const errors = [];
  if (typeof body !== 'object' || body === null) {
    errors.push('Request body must be a JSON object.');
    return { valid: false, errors };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in body)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  const payload = /** @type {Record<string, unknown>} */ (body);

  if (!isValidTimestamp(payload.timestamp)) {
    errors.push('timestamp must be a valid ISO-8601 string or epoch milliseconds.');
  }

  if (!isFiniteNumber(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
    errors.push('latitude must be a number between -90 and 90.');
  }

  if (!isFiniteNumber(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
    errors.push('longitude must be a number between -180 and 180.');
  }

  if (typeof payload.trackStatus !== 'string' || payload.trackStatus.trim().length === 0) {
    errors.push('trackStatus must be a non-empty string.');
  }

  if (payload.altitude !== undefined && !isFiniteNumber(payload.altitude)) {
    errors.push('altitude must be a number when provided.');
  }

  if (payload.groundSpeed !== undefined && !isFiniteNumber(payload.groundSpeed)) {
    errors.push('groundSpeed must be a number when provided.');
  }

  if (payload.heading !== undefined && !isFiniteNumber(payload.heading)) {
    errors.push('heading must be a number when provided.');
  }

  if (payload.batteryLevel !== undefined && (!isFiniteNumber(payload.batteryLevel) || payload.batteryLevel < 0 || payload.batteryLevel > 100)) {
    errors.push('batteryLevel must be between 0 and 100 when provided.');
  }

  if (payload.batteryVoltage !== undefined && !isFiniteNumber(payload.batteryVoltage)) {
    errors.push('batteryVoltage must be a number when provided.');
  }

  if (payload.batteryTemperature !== undefined && !isFiniteNumber(payload.batteryTemperature)) {
    errors.push('batteryTemperature must be a number when provided.');
  }

  if (payload.temperature !== undefined && !isFiniteNumber(payload.temperature)) {
    errors.push('temperature must be a number when provided.');
  }

  if (payload.humidity !== undefined && (!isFiniteNumber(payload.humidity) || payload.humidity < 0 || payload.humidity > 100)) {
    errors.push('humidity must be between 0 and 100 when provided.');
  }

  if (payload.windSpeed !== undefined && !isFiniteNumber(payload.windSpeed)) {
    errors.push('windSpeed must be a number when provided.');
  }

  if (payload.windDirection !== undefined && !isFiniteNumber(payload.windDirection)) {
    errors.push('windDirection must be a number when provided.');
  }

  if (payload.visibility !== undefined && !isFiniteNumber(payload.visibility)) {
    errors.push('visibility must be a number when provided.');
  }

  if (payload.pressure !== undefined && !isFiniteNumber(payload.pressure)) {
    errors.push('pressure must be a number when provided.');
  }

  return {
    valid: errors.length === 0,
    errors,
    payload: /** @type {import('../types/telemetry.js').TelemetryPayload} */ (payload),
  };
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidTimestamp(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  if (typeof value === 'string') {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }
  return false;
}

module.exports = { validateTelemetry };
