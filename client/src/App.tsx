import { useEffect, useMemo, useRef, useState } from 'react';
import MapView from './components/MapView';
import { TelemetryPayload, UiTelemetry } from './types';

const DEFAULT_POSITION: [number, number] = [37.7749, -122.4194];
const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws?token=demo-token';

function createInitialTelemetry(): UiTelemetry {
  return {
    timestamp: new Date().toISOString(),
    coordinates: { latitude: DEFAULT_POSITION[0], longitude: DEFAULT_POSITION[1] },
    trackStatus: 'Initializing',
    motion: { groundSpeed: 0, heading: 0 },
    identifiers: {},
    power: {},
    weather: {},
    path: [DEFAULT_POSITION],
    lastUpdated: null,
    source: 'simulated',
  };
}

function buildWs(): WebSocket | null {
  try {
    return new WebSocket(DEFAULT_WS_URL);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to open WebSocket', err);
    return null;
  }
}

export default function App() {
  const [telemetry, setTelemetry] = useState<UiTelemetry>(createInitialTelemetry);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'live' | 'error'>('connecting');
  const [mode, setMode] = useState<'live' | 'simulate'>('live');
  const [message, setMessage] = useState('Connecting to stream...');
  const socketRef = useRef<WebSocket | null>(null);
  const simulationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const position = useMemo<[number, number]>(() => {
    const { latitude, longitude } = telemetry.coordinates;
    return [latitude, longitude];
  }, [telemetry.coordinates]);

  useEffect(() => {
    if (mode === 'simulate') {
      startSimulation();
      return () => stopSimulation();
    }

    stopSimulation();
    startLiveStream();

    return () => {
      socketRef.current?.close();
    };
  }, [mode]);

  function startLiveStream() {
    setWsStatus('connecting');
    setMessage('Connecting to WebSocket...');
    const socket = buildWs();
    socketRef.current = socket;
    if (!socket) {
      setWsStatus('error');
      setMessage('WebSocket unavailable, switch to Simulation');
      return;
    }

    socket.onopen = () => {
      setWsStatus('live');
      setMessage('Receiving live telemetry');
      setTelemetry((prev) => ({ ...prev, source: 'live' }));
    };

    socket.onerror = () => {
      setWsStatus('error');
      setMessage('Connection error, try Simulation');
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
      setMessage('Disconnected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type !== 'telemetry' || !data.payload) return;
        const payload = data.payload as TelemetryPayload;
        updateTelemetry(payload, 'live');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse WebSocket payload', err);
      }
    };
  }

  function startSimulation() {
    setMessage('Simulation mode active');
    setWsStatus('live');
    setTelemetry((prev) => ({ ...prev, source: 'simulated' }));
    if (simulationTimer.current) return;

    let heading = 0;
    let speed = 12;
    simulationTimer.current = setInterval(() => {
      heading = (heading + 8) % 360;
      speed = Math.max(5, Math.min(25, speed + (Math.random() * 4 - 2)));

      const rad = (heading * Math.PI) / 180;
      const deltaLat = (speed / 5000) * Math.cos(rad);
      const deltaLng = (speed / 5000) * Math.sin(rad);

      const [lat, lng] = position;
      const next: TelemetryPayload = {
        timestamp: new Date().toISOString(),
        coordinates: {
          latitude: lat + deltaLat,
          longitude: lng + deltaLng,
          altitude: 120 + Math.sin(heading) * 10,
        },
        trackStatus: 'Simulated Flight',
        motion: { groundSpeed: speed, heading },
        identifiers: {
          flightCode: 'DEV-001',
          manufacturerId: 'DemoDynamics',
          orderId: 'SIM-TRACK',
          sn: 'SIM-DRONE',
        },
        power: { level: 78, voltage: 11.1, status: 'Nominal' },
        weather: { temperature: 19, windSpeed: 5 + Math.random() * 3, windDirection: heading },
      };

      updateTelemetry(next, 'simulated');
    }, 1500);
  }

  function stopSimulation() {
    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
      simulationTimer.current = null;
    }
  }

  function updateTelemetry(payload: TelemetryPayload, source: 'live' | 'simulated') {
    setTelemetry((prev) => {
      const nextPath = [...prev.path, [payload.coordinates.latitude, payload.coordinates.longitude]].slice(-80);
      return {
        ...prev,
        ...payload,
        path: nextPath,
        lastUpdated: new Date().toLocaleTimeString(),
        source,
      };
    });
  }

  function handleModeToggle(nextMode: 'live' | 'simulate') {
    setMode(nextMode);
  }

  const statusColor = wsStatus === 'live' ? 'status-live' : wsStatus === 'connecting' ? 'status-connecting' : 'status-error';

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Drone Monitoring Platform</p>
          <h1>UAV Telemetry Console</h1>
          <p className="lede">
            Real-time tracking of fleet aircraft with mapping overlays, metrics, and simulated playback for offline testing.
          </p>
        </div>
        <div className="mode-toggle" role="group" aria-label="Data source mode">
          <button className={mode === 'live' ? 'active' : ''} onClick={() => handleModeToggle('live')}>
            Live Stream
          </button>
          <button className={mode === 'simulate' ? 'active' : ''} onClick={() => handleModeToggle('simulate')}>
            Simulation
          </button>
        </div>
      </header>

      <div className="layout">
        <section className="panel map-panel">
          <div className="panel-header">
            <h2>Map Overview</h2>
            <div className={`pill ${statusColor}`}>{message}</div>
          </div>
          <MapView
            position={position}
            path={telemetry.path}
            heading={telemetry.motion?.heading}
            trackStatus={telemetry.trackStatus}
          />
        </section>

        <section className="panel info-panel">
          <div className="panel-header">
            <h2>Flight Snapshot</h2>
            <span className="timestamp">Last updated: {telemetry.lastUpdated || '–'}</span>
          </div>

          <div className="grid">
            <InfoCard label="Flight" value={telemetry.identifiers?.flightCode || 'N/A'} />
            <InfoCard label="Model" value={telemetry.identifiers?.sn || 'Unknown'} />
            <InfoCard label="Manufacturer" value={telemetry.identifiers?.manufacturerId || 'Unknown'} />
            <InfoCard label="Order" value={telemetry.identifiers?.orderId || 'Unassigned'} />
            <InfoCard label="Status" value={telemetry.trackStatus} accent />
            <InfoCard label="Speed" value={`${Math.round(telemetry.motion?.groundSpeed ?? 0)} m/s`} />
            <InfoCard label="Altitude" value={`${Math.round(telemetry.coordinates.altitude ?? 0)} m`} />
            <InfoCard label="Heading" value={`${Math.round(telemetry.motion?.heading ?? 0)}°`} />
            <InfoCard label="Battery" value={`${telemetry.power?.level ?? 0}% (${telemetry.power?.status || 'n/a'})`} />
            <InfoCard label="Voltage" value={telemetry.power?.voltage ? `${telemetry.power.voltage} V` : 'n/a'} />
            <InfoCard label="Temperature" value={telemetry.weather?.temperature ? `${telemetry.weather.temperature} °C` : 'n/a'} />
            <InfoCard label="Wind" value={telemetry.weather?.windSpeed ? `${telemetry.weather.windSpeed.toFixed(1)} m/s` : 'n/a'} />
          </div>

          <div className="footer-row">
            <div className="pill ghost">Source: {telemetry.source}</div>
            <button className="secondary">History Playback (coming soon)</button>
          </div>
        </section>
      </div>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

function InfoCard({ label, value, accent = false }: InfoCardProps) {
  return (
    <div className={`card ${accent ? 'accent' : ''}`}>
      <p className="label">{label}</p>
      <p className="value">{value}</p>
    </div>
  );
}
