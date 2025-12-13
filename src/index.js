require('ts-node/register');
const http = require('http');
const { handleRequest } = require('./api/router.js');
const { startMqttSubscriber } = require('./services/mqtt.js');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'uas/telemetry';

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`HTTP server listening on http://0.0.0.0:${PORT}`);
});

if (MQTT_BROKER_URL) {
  startMqttSubscriber({ brokerUrl: MQTT_BROKER_URL, topic: MQTT_TOPIC }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start MQTT subscriber:', error.message);
  });
}
