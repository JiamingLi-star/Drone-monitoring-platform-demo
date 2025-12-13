import assert from 'node:assert';
import test from 'node:test';
import { InfluxTelemetryWriter, __private__, TelemetryWrite } from './influx';

const basePayload: TelemetryWrite = {
  timestamp: '2024-01-01T00:00:00.000Z',
  latitude: 12.34,
  longitude: 56.78,
  trackStatus: 'on_course',
  altitude: 120,
  height: 80,
  verticalSpeed: 1.2,
  groundSpeed: 15,
  course: 90,
  batteryLevel: 75,
  orderId: 'ORD-1',
  sn: 'SN-123',
  flightCode: 'FLT-9',
  manufacturerId: 'MFG-8',
  coordinateType: 'wgs84',
  heightType: 'agl',
};

test('buildPoint maps fields and tags to measurement', () => {
  const point = __private__.buildPoint(basePayload);
  const lineProtocol = point.toLineProtocol();

  assert(lineProtocol?.startsWith('uas_telemetry'));
  assert(lineProtocol?.includes('orderID=ORD-1'));
  assert(lineProtocol?.includes('sn=SN-123'));
  assert(lineProtocol?.includes('flightCode=FLT-9'));
  assert(lineProtocol?.includes('manufacturerID=MFG-8'));
  assert(lineProtocol?.includes('coordinateType=wgs84'));
  assert(lineProtocol?.includes('heightType=agl'));
  assert(lineProtocol?.includes('latitude=12.34'));
  assert(lineProtocol?.includes('longitude=56.78'));
  assert(lineProtocol?.includes('altitude=120'));
  assert(lineProtocol?.includes('height=80'));
  assert(lineProtocol?.includes('verticalSpeed=1.2'));
  assert(lineProtocol?.includes('groundSpeed=15'));
  assert(lineProtocol?.includes('course=90'));
  assert(lineProtocol?.includes('batteryLevel=75'));
});

test('write retries on failure before succeeding', async () => {
  let flushCalls = 0;
  const mockWriteApi = {
    writePoint: () => {},
    flush: async () => {
      flushCalls += 1;
      if (flushCalls < 3) throw new Error('transient');
    },
  } as any;

  const writer = new InfluxTelemetryWriter(mockWriteApi, { maxRetries: 3, backoffMs: 0 });
  await writer.write(basePayload);
  assert.equal(flushCalls, 3);
});

test('write surfaces failure after retries and enqueues payload', async () => {
  let flushCalls = 0;
  const mockWriteApi = {
    writePoint: () => {},
    flush: async () => {
      flushCalls += 1;
      throw new Error('persist fail');
    },
  } as any;

  const writer = new InfluxTelemetryWriter(mockWriteApi, { maxRetries: 1, backoffMs: 0 });
  await assert.rejects(writer.write(basePayload));
  assert.equal(flushCalls, 2);
});
