import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon issue by using CDN assets
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map interactions and synchronization
function MapEvents({ onChangePosition, position }) {
  const map = useMap();

  // Smoothly pan map when coordinate props change externally (e.g. from Auto-Locate)
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.panTo(position);
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      onChangePosition(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });

  return null;
}

export default function LocationPicker({ lat, lng, onChange }) {
  const defaultLat = 27.7029;
  const defaultLng = 85.3072;

  const currentLat = parseFloat(lat) || defaultLat;
  const currentLng = parseFloat(lng) || defaultLng;
  const position = [currentLat, currentLng];

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker != null) {
      const newPos = marker.getLatLng();
      onChange(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
    }
  };

  return (
    <div style={{ height: '320px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', margin: 'var(--space-3) 0' }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          icon={customIcon}
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDragEnd,
          }}
        />
        <MapEvents onChangePosition={onChange} position={position} />
      </MapContainer>
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 1000, background: 'var(--bg-1)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
        Click map or drag marker to set coordinates
      </div>
    </div>
  );
}
