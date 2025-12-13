export interface TelemetryPayload {
  timestamp: string | number;
  latitude: number;
  longitude: number;
  trackStatus: string;
  altitude?: number;
  groundSpeed?: number;
  heading?: number;
  orderId?: string;
  sn?: string;
  flightCode?: string;
  manufacturerId?: string;
  coordinateType?: string;
  heightType?: string;
}
