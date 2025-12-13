import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

interface EnvConfig {
  httpPort: number;
  wsPort: number;
  mqttPort: number;
  corsOrigin: string;
  influx: {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    org: string;
    bucket: string;
    token: string;
  };
  logLevel: string;
}

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env: EnvConfig = {
  httpPort: parseNumber(process.env.HTTP_PORT, 3000),
  wsPort: parseNumber(process.env.WS_PORT, 3001),
  mqttPort: parseNumber(process.env.MQTT_PORT, 1883),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  influx: {
    host: process.env.INFLUX_HOST || 'localhost',
    port: parseNumber(process.env.INFLUX_PORT, 8086),
    protocol: (process.env.INFLUX_PROTOCOL as 'http' | 'https') || 'http',
    org: process.env.INFLUX_ORG || 'your-org',
    bucket: process.env.INFLUX_BUCKET || 'your-bucket',
    token: process.env.INFLUX_TOKEN || 'your-token',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};
