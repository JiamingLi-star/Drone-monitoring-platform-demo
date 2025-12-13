/**
 * @typedef {Object} TelemetryPayload
 * @property {string|number} timestamp ISO 8601 string or unix epoch milliseconds.
 * @property {number} latitude Latitude in decimal degrees (-90 to 90).
 * @property {number} longitude Longitude in decimal degrees (-180 to 180).
 * @property {string} trackStatus Track state flag (e.g., "on_course", "returning", "lost").
 * @property {number} [altitude] Altitude in meters.
 * @property {number} [groundSpeed] Ground speed in m/s.
 * @property {number} [heading] Heading in degrees.
 */

/**
 * @typedef {Object} StandardResponse
 * @property {boolean} success Indicates the request completed without validation errors.
 * @property {number} [code] Success code (0 when successful).
 * @property {string} [errorCode] Application error code when unsuccessful.
 * @property {string} [errorMsg] Error description when unsuccessful.
 * @property {Object} [data] Optional payload returned on success.
 */

module.exports = {};
