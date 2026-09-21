import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  Layers,
  ExternalLink,
  Target,
  Maximize2,
  Globe2,
  Navigation
} from 'lucide-react';

interface InteractiveGeoMapProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  locationName: string;
  country: string;
  confidenceScore: number;
  confidenceRating: string;
}

export const InteractiveGeoMap: React.FC<InteractiveGeoMapProps> = ({
  coordinates,
  locationName,
  country,
  confidenceScore,
  confidenceRating,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');

  // Layer tile configurations
  const TILE_URLS = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const ATTRIBUTIONS = {
    satellite: '&copy; Esri &mdash; Earthstar Geographics',
    street: '&copy; OpenStreetMap contributors',
  };

  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coordinates.lat, coordinates.lng],
      zoom: 12,
      zoomControl: false,
    });

    // Custom tactical zoom control on bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialLayer = L.tileLayer(TILE_URLS.satellite, {
      attribution: ATTRIBUTIONS.satellite,
      maxZoom: 19,
    }).addTo(map);
    currentTileLayerRef.current = initialLayer;

    // Custom pulsing target icon
    const customIcon = L.divIcon({
      className: 'custom-geo-marker',
      html: `
        <div class="relative flex items-center justify-center w-12 h-12 -ml-6 -mt-6">
          <div class="absolute w-12 h-12 rounded-full bg-pink-500/20 animate-ping"></div>
          <div class="absolute w-8 h-8 rounded-full bg-emerald-400/30 border border-emerald-400 animate-pulse"></div>
          <div class="relative w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    const marker = L.marker([coordinates.lat, coordinates.lng], { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    // Precision radius circle (500m)
    const circle = L.circle([coordinates.lat, coordinates.lng], {
      radius: 400,
      color: '#ec4899',
      fillColor: '#ec4899',
      fillOpacity: 0.15,
      weight: 1.5,
      dashArray: '4, 6',
    }).addTo(map);
    circleRef.current = circle;

    mapInstanceRef.current = map;

    // Ensure Leaflet calculates dimensions correctly when mounted
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center & marker when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([coordinates.lat, coordinates.lng], 13, {
      duration: 1.6,
      easeLinearity: 0.25,
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([coordinates.lat, coordinates.lng]);
    }
  }, [coordinates.lat, coordinates.lng]);

  // Update tile layer when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newLayer = L.tileLayer(TILE_URLS[mapType], {
      attribution: ATTRIBUTIONS[mapType],
      maxZoom: 19,
    }).addTo(map);
    currentTileLayerRef.current = newLayer;
  }, [mapType]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates.lat},${coordinates.lng}`;

  return (
    <div className="glass-panel flex flex-col h-full rounded-3xl overflow-hidden shadow-2xl">
      {/* Map Header HUD */}
      <div className="px-5 py-3.5 bg-slate-900/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></div>
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
            SATELLITE RADAR LOCK
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">
            {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
          </span>
        </div>

        {/* Layer Switcher & External Links */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-950/80 p-0.5 border border-white/10 text-[11px]">
            <button
              id="map-tile-satellite-btn"
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                mapType === 'satellite'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite
            </button>
            <button
              id="map-tile-street-btn"
              onClick={() => setMapType('street')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                mapType === 'street'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Street
            </button>
          </div>

          <a
            id="open-google-maps-btn"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
          >
            <Globe2 className="w-3 h-3" />
            Maps
            <ExternalLink className="w-2.5 h-2.5" />
          </a>

          <a
            id="open-street-view-btn"
            href={streetViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
          >
            <Navigation className="w-3 h-3" />
            Street View
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Map Body Canvas */}
      <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] w-full">
        <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" />

        {/* Top-Left OSINT HUD Overlay */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none space-y-1">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs shadow-lg max-w-xs">
            <div className="text-[10px] uppercase font-mono tracking-wider text-pink-400 font-semibold flex items-center gap-1">
              <Target className="w-3 h-3 text-pink-400" />
              Pinpointed Ground Zero
            </div>
            <div className="text-white font-semibold truncate mt-0.5">{locationName}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>{country}</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-bold">{confidenceScore}% Confidence</span>
            </div>
          </div>
        </div>

        {/* Radar Crosshair Center Indicator & Rotating Sweep Beam */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 overflow-hidden">
          {/* Animated Sweeping Radar Beam */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-emerald-500/20">
            <div className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.18)_360deg)] animate-spin-slow"></div>
          </div>
          
          {/* Concentric Radar Distance Rings */}
          <div className="absolute w-64 h-64 rounded-full border border-pink-500/20"></div>
          <div className="absolute w-40 h-40 rounded-full border border-dashed border-pink-500/30"></div>
          <div className="w-20 h-20 rounded-full border-2 border-pink-500/50 flex items-center justify-center">
            <div className="w-0.5 h-full bg-pink-500/40"></div>
            <div className="h-0.5 w-full bg-pink-500/40 absolute"></div>
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></div>
          </div>
        </div>
      </div>

      {/* Map Bottom Status Bar */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GPS RESOLVED
          </span>
          <span className="hidden sm:inline text-slate-500">
            Confidence Rating: <strong className="text-slate-300 font-semibold">{confidenceRating}</strong>
          </span>
        </div>
        <div className="text-slate-500">
          Scroll to zoom &bull; Drag to pan &bull; Click marker for street view
        </div>
      </div>
    </div>
  );
};
