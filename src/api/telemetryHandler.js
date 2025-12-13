const { validateTelemetry } = require('../validation/telemetry.js');
const { processTelemetry } = require('../services/telemetryPipeline.js');

/**
 * Handle POST /api/v1/uas/telemetry
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} rawBody
 */
function handleTelemetry(req, res, rawBody) {
  let body;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    return sendJson(res, 400, {
      success: false,
      errorCode: 'INVALID_JSON',
      errorMsg: 'Request body is not valid JSON.',
    });
  }

  const result = validateTelemetry(body);
  if (!result.valid || !result.payload) {
    return sendJson(res, 400, {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      errorMsg: result.errors.join('; '),
    });
  }

  const data = processTelemetry(result.payload);
  return sendJson(res, 200, { success: true, code: 0, data });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

module.exports = { handleTelemetry };
