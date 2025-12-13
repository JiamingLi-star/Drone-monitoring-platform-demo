import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';
import { env } from '../config/env';
import { TelemetryPayload } from '../types/telemetry';

type Nullable<T> = T | null | undefined;

type TelemetryTags = {
  orderId?: string;
  sn?: string;
  flightCode?: string;
  manufacturerId?: string;
  coordinateType?: string;
  heightType?: string;
};

export type TelemetryWrite = TelemetryPayload & {
  altitude?: number;
  height?: number;
  verticalSpeed?: number;
  groundSpeed?: number;
  course?: number;
  batteryLevel?: number;
} & TelemetryTags;

export interface InfluxWriteOptions {
  maxRetries?: number;
  backoffMs?: number;
}

const MEASUREMENT = 'uas_telemetry';

const toDate = (value: string | number): Date => new Date(value);

const createClient = () => {
  const url = `${env.influx.protocol}://${env.influx.host}:${env.influx.port}`;
  return new InfluxDB({ url, token: env.influx.token });
};

const buildPoint = (payload: TelemetryWrite): Point => {
  const point = new Point(MEASUREMENT)
    .floatField('latitude', payload.latitude)
    .floatField('longitude', payload.longitude)
    .timestamp(toDate(payload.timestamp));

  const optionalField = (key: string, value: Nullable<number>) => {
    if (value === null || value === undefined) return;
    point.floatField(key, value);
  };

  optionalField('altitude', payload.altitude);
  optionalField('height', payload.height);
  optionalField('verticalSpeed', payload.verticalSpeed);
  optionalField('groundSpeed', payload.groundSpeed);
  optionalField('course', payload.course ?? payload.heading);
  optionalField('batteryLevel', payload.batteryLevel);

  const optionalTag = (key: string, value: Nullable<string>) => {
    if (!value) return;
    point.tag(key, value);
  };

  optionalTag('orderID', payload.orderId);
  optionalTag('sn', payload.sn);
  optionalTag('flightCode', payload.flightCode);
  optionalTag('manufacturerID', payload.manufacturerId);
  optionalTag('coordinateType', payload.coordinateType);
  optionalTag('heightType', payload.heightType);

  return point;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class InfluxTelemetryWriter {
  private writeApi: WriteApi;
  private queue: TelemetryWrite[] = [];
  private processing = false;
  private readonly maxRetries: number;
  private readonly backoffMs: number;

  constructor(writeApi?: WriteApi, options?: InfluxWriteOptions) {
    this.writeApi = writeApi ?? createClient().getWriteApi(env.influx.org, env.influx.bucket, 'ms');
    this.maxRetries = options?.maxRetries ?? 3;
    this.backoffMs = options?.backoffMs ?? 100;
  }

  async write(payload: TelemetryWrite): Promise<void> {
    try {
      await this.writeWithRetry(payload);
    } catch (error) {
      this.queue.push(payload);
      if (!this.processing) {
        void this.processQueue();
      }
      throw error;
    }
  }

  private async writeWithRetry(payload: TelemetryWrite): Promise<void> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      try {
        const point = buildPoint(payload);
        this.writeApi.writePoint(point);
        await this.writeApi.flush();
        return;
      } catch (error) {
        lastError = error;
        if (attempt === this.maxRetries) break;
        attempt += 1;
        await delay(this.backoffMs * attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to write telemetry to InfluxDB');
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const payload = this.queue.shift();
      if (!payload) continue;

      try {
        await this.writeWithRetry(payload);
      } catch (error) {
        this.queue.unshift(payload);
        await delay(this.backoffMs);
        break;
      }
    }

    this.processing = false;
  }
}

const sharedWriter = new InfluxTelemetryWriter();

export const writeTelemetryPoint = (payload: TelemetryWrite): Promise<void> => sharedWriter.write(payload);

export const __private__ = { buildPoint, createClient };
