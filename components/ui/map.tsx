'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Configure default marker icons
L.Icon.Default.mergeOptions({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
});

interface MapProps {
  center: [number, number];
  zoom: number;
  className?: string;
  markers?: Array<{
    position: [number, number];
    title: string;
  }>;
}

export default function Map({ center, zoom, className, markers = [] }: MapProps) {
  useEffect(() => {
    // Force a re-render after mount to ensure proper sizing
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker, index) => (
        <Marker 
          key={index} 
          position={marker.position}
        >
          <Popup>{marker.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 