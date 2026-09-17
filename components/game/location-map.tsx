'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import type { GameLocationDTO } from '@/lib/api';
import { FEATURE_CHAT_ENABLED } from '@/lib/feature-flags';

interface LocationMapProps {
  locations: GameLocationDTO[];
}

/** Fit bounds to all markers once */
function FitBounds({ locations }: LocationMapProps) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.25), { maxZoom: 16 });
  }, [locations, map]);

  return null;
}

/** Custom noir-styled marker icons */
function makeIcon(unlocked: boolean): L.DivIcon {
  const inner = unlocked
    ? `<span class="map-pin map-pin-unlocked">🔍</span>`
    : `<span class="map-pin map-pin-locked">🔒</span>`;

  return L.divIcon({
    className: 'munton-map-pin-wrapper',
    html: inner,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  });
}

export default function LocationMap({ locations }: LocationMapProps) {
  const hasCoords = locations.length > 0;

  // Zutphen city centre fallback
  const center: [number, number] = hasCoords
    ? [
        locations.reduce((s, l) => s + l.latitude, 0) / locations.length,
        locations.reduce((s, l) => s + l.longitude, 0) / locations.length,
      ]
    : [52.139, 6.196];

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom
      className="munton-map h-[60vh] w-full rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds locations={locations} />

      {locations.map(loc => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={makeIcon(loc.isUnlocked)}
        >
          <Popup>
            <div className="map-popup">
              <h3 className="map-popup-title">{loc.name}</h3>
              {loc.characterName && (
                <p className="map-popup-character">
                  Verdachte op deze plek: <strong>{loc.characterName}</strong>
                </p>
              )}
              {loc.description && <p className="map-popup-desc">{loc.description}</p>}

              {loc.isUnlocked ? (
                FEATURE_CHAT_ENABLED ? (
                  <Link
                    href={`/chat?character=${loc.characterId}`}
                    className="map-popup-cta map-popup-cta-unlocked"
                  >
                    Ga naar gesprek →
                  </Link>
                ) : (
                  <Link
                    href={`/game?tab=onderzoek&location=${loc.id}`}
                    className="map-popup-cta map-popup-cta-unlocked"
                  >
                    Open het dossier →
                  </Link>
                )
              ) : (
                <Link href="/unlock" className="map-popup-cta map-popup-cta-locked">
                  🔒 Scan hier de QR- of NFC-code
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
