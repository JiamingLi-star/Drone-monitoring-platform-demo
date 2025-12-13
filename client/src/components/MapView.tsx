import { useEffect, useRef } from 'react';
import L, { Map as LeafletMap, Marker, Polyline } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  position: [number, number];
  path: [number, number][];
  heading?: number;
  trackStatus: string;
}

const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6"/><path d="M5 12l7-7 7 7"/></svg>`;

export default function MapView({ position, path, heading, trackStatus }: MapViewProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const arrowRef = useRef<Marker | null>(null);
  const pathRef = useRef<Polyline | null>(null);

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('map', {
      zoomControl: false,
    }).setView(position, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.scale({ metric: true, imperial: false }).addTo(map);

    mapRef.current = map;
  }, [position]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!markerRef.current) {
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowSize: [41, 41],
      });
      markerRef.current = L.marker(position, { icon }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(position);
    }

    if (!arrowRef.current) {
      arrowRef.current = L.marker(position, {
        icon: L.divIcon({
          className: 'heading-arrow',
          html: arrowSvg,
          iconAnchor: [16, 16],
        }),
      }).addTo(mapRef.current);
    }

    arrowRef.current?.setLatLng(position);
    const rotation = heading ?? 0;
    const el = arrowRef.current?.getElement();
    if (el) {
      el.style.transform = `rotate(${rotation}deg)`;
    }

    if (path.length >= 2) {
      if (!pathRef.current) {
        pathRef.current = L.polyline(path, { color: '#6C5CE7', weight: 4 }).addTo(mapRef.current);
      } else {
        pathRef.current.setLatLngs(path);
      }
    }

    const map = mapRef.current;
    const bounds = L.latLngBounds(path.length ? path : [position]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  }, [position, path, heading]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const statusControl = L.control({ position: 'topright' });
    statusControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'status-pill');
      div.innerHTML = `Status: <strong>${trackStatus || 'Unknown'}</strong>`;
      return div;
    };

    statusControl.addTo(map);

    return () => {
      statusControl.remove();
    };
  }, [trackStatus]);

  return <div id="map" className="map" role="img" aria-label="Drone map view" />;
}
