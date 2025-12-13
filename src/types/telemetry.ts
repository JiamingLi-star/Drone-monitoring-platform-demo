export interface TelemetryPayload {
  timestamp: string | number;
  latitude: number;
  longitude: number;
  trackStatus: string;
  altitude?: number;
  groundSpeed?: number;
  heading?: number;
  batteryLevel?: number;
  batteryVoltage?: number;
  batteryStatus?: string;
  batteryTemperature?: number;
  orderId?: string;
  sn?: string;
  flightCode?: string;
  manufacturerId?: string;
  coordinateType?: string;
  heightType?: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  visibility?: number;
  pressure?: number;
}
