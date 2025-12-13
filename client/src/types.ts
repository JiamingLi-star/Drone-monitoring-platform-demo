export interface TelemetryPayload {
  timestamp: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  trackStatus: string;
  motion?: {
    groundSpeed?: number;
    heading?: number;
  };
  identifiers?: {
    flightCode?: string;
    manufacturerId?: string;
    orderId?: string;
    sn?: string;
  };
  power?: {
    level?: number;
    voltage?: number;
    temperature?: number;
    status?: string;
  };
  weather?: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    visibility?: number;
    pressure?: number;
  };
}

export interface UiTelemetry extends TelemetryPayload {
  path: [number, number][];
  lastUpdated: string | null;
  source: 'live' | 'simulated';
}
