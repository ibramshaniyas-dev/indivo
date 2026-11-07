import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// OpenStreetMap tiles (free, no API key; attribution required by the OSM tile policy).
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ZONE = '#a86a00';
const SELECTED = '#7A5517';

function ClickToPin({ onPick }) {
  useMapEvents({ click: (e) => onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], zoom ?? map.getZoom(), { duration: 0.6 });
  }, [center?.lat, center?.lng]);
  return null;
}

/**
 * Map of demo zones. Every zone is drawn as a circle (its service radius); the zone being edited
 * is highlighted, and clicking the map drops / moves its pin.
 */
export default function ZoneMap({ zones = [], draft, onPick, focus, height = 460 }) {
  const start = draft?.lat ? draft : zones[0] ? { lat: zones[0].latitude, lng: zones[0].longitude } : { lat: 11.0168, lng: 76.9558 };
  return (
    <MapContainer center={[start.lat, start.lng]} zoom={12} style={{ height, width: '100%', borderRadius: 12, cursor: 'crosshair' }} scrollWheelZoom>
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      <ClickToPin onPick={onPick} />
      <FlyTo center={focus} />
      {zones.filter((z) => !draft || z.id !== draft.id).map((z) => (
        <Circle
          key={z.id}
          center={[z.latitude, z.longitude]}
          radius={z.radiusKm * 1000}
          pathOptions={{ color: ZONE, weight: 1.5, fillOpacity: z.isActive ? 0.12 : 0.04, dashArray: z.isActive ? undefined : '4 4' }}
        >
          <Tooltip>{z.name} · {z.radiusKm} km{z.isActive ? '' : ' (off)'}</Tooltip>
        </Circle>
      ))}
      {draft?.lat && (
        <>
          <Circle center={[draft.lat, draft.lng]} radius={(Number(draft.radiusKm) || 0) * 1000} pathOptions={{ color: SELECTED, weight: 2.5, fillOpacity: 0.18 }} />
          <CircleMarker center={[draft.lat, draft.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: SELECTED, fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -10]}>{draft.name || 'New location'}</Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
