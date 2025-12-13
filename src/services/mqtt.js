const { validateTelemetry } = require('../validation/telemetry.js');
const { processTelemetry } = require('./telemetryPipeline.js');

/**
 * Start MQTT subscription for telemetry ingestion.
 * @param {{brokerUrl: string, topic: string}} options
 * @returns {Promise<import('mqtt').MqttClient|null>}
 */
async function startMqttSubscriber(options) {
  const mqttModule = await import('mqtt').catch((error) => {
    // eslint-disable-next-line no-console
    console.warn('mqtt package not installed; skipping MQTT subscription.', error.message);
    return null;
  });

  if (!mqttModule) return null;
  const mqtt = mqttModule.default || mqttModule;
  const client = mqtt.connect(options.brokerUrl);

  client.on('connect', () => {
    client.subscribe(options.topic, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('MQTT subscription failed:', err.message);
      } else {
        // eslint-disable-next-line no-console
        console.log(`Subscribed to MQTT topic ${options.topic}`);
      }
    });
  });

  client.on('message', (topic, message) => {
    try {
      const parsed = JSON.parse(message.toString('utf8'));
      const result = validateTelemetry(parsed);
      if (!result.valid || !result.payload) {
        // eslint-disable-next-line no-console
        console.warn('MQTT telemetry validation failed:', result.errors.join('; '));
        return;
      }
      processTelemetry(result.payload);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to process MQTT message', error.message);
    }
  });

  return client;
}

module.exports = { startMqttSubscriber };
