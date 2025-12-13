const { parse } = require('url');
const { handleTelemetry } = require('./telemetryHandler.js');

/**
 * Basic router for demo HTTP server.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleRequest(req, res) {
  const { pathname } = parse(req.url || '', true);

  if (req.method === 'POST' && pathname === '/api/v1/uas/telemetry') {
    return bufferBody(req)
      .then((rawBody) => handleTelemetry(req, res, rawBody))
      .catch(() => {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, errorCode: 'BUFFER_ERROR', errorMsg: 'Unable to read request body.' }));
      });
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, errorCode: 'NOT_FOUND', errorMsg: 'Route not found' }));
}

/**
 * Collect body chunks as string.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function bufferBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

module.exports = { handleRequest };
