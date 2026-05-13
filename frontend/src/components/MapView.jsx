import { useEffect, useRef, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import axios from "axios";
import { api } from "../utils/api";
import RiskMapOverlay from "./RiskMapOverlay";

// Fix for default marker icons in Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitBounds({ points }) {
  const map = useMap();
  const lastPoints = useRef("");
  const [autoFollow, setAutoFollow] = useState(true);

  useEffect(() => {
    const stopFollow = () => setAutoFollow(false);
    map.on("dragstart", stopFollow);
    map.on("zoomstart", stopFollow);
    return () => {
      map.off("dragstart", stopFollow);
      map.off("zoomstart", stopFollow);
    };
  }, [map]);

  useEffect(() => {
    if (!autoFollow) return;
    if (points && points.length > 0) {
      const currentPointsStr = JSON.stringify(points);
      if (currentPointsStr === lastPoints.current) return;
      
      try {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], animate: true });
          lastPoints.current = currentPointsStr;
        }
      } catch (e) {
        console.warn("FitBounds failed:", e);
      }
    }
  }, [map, points, autoFollow]);
  return null;
}

export default function MapView({ itinerary = [], mapStyle = "colorful" }) {
  const { tourists, alerts, socket } = useApp();
  const [globalZones, setGlobalZones] = useState([]);
  
  // Fetch Persistent Danger Zones Intelligence
  useEffect(() => {
    axios.get(api("/api/zones"))
      .then(res => setGlobalZones(res.data))
      .catch(err => console.error("Failed to load intelligence zones", err));
  }, []);
  
  // Extract itinerary points for centering
  const itineraryMarkers = useMemo(() => (itinerary || [])
    .flatMap((day) => day.activities || [])
    .filter(a => a.lat && a.lon)
    .map((a) => [a.lat, a.lon]), [itinerary]);

  // Track Live Location
  useEffect(() => {
    if (!navigator.geolocation || !socket) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit("track-location", {
          userId: "me",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
      },
      (err) => {
        if (err.code === 3) {
          console.warn("GPS Timeout: System is taking longer than usual to find your location.");
        } else {
          console.warn("Geolocation Error:", err.message);
        }
      },
      { 
        enableHighAccuracy: false, 
        timeout: 15000,           
        maximumAge: 10000 
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket]);

  const touristPoints = useMemo(() => Object.values(tourists).map((t) => [t.lat, t.lon]), [tourists]);
  
  const sosAlerts = useMemo(() => alerts.filter(a => a.type === 'SOS' && a.lat && a.lon), [alerts]);
  const wildernessAlerts = useMemo(() => alerts.filter(a => (a.type === 'WILDERNESS_BREACH' || a.type === 'WILDERNESS_EXPIRED') && a.lat && a.lon), [alerts]);
  
  const sosPoints = useMemo(() => sosAlerts.map(a => [a.lat, a.lon]), [sosAlerts]);
  const wildernessPoints = useMemo(() => wildernessAlerts.map(a => [a.lat, a.lon]), [wildernessAlerts]);
  
  const allPoints = useMemo(() => {
    // Priority 1: If there's an itinerary, focus ONLY on the trip destination
    if (itineraryMarkers.length > 0) return itineraryMarkers;
    
    // Priority 2: Fallback to all other points (tourists, SOS, etc)
    const points = [...touristPoints, ...sosPoints, ...wildernessPoints];
    return points;
  }, [itineraryMarkers, touristPoints, sosPoints, wildernessPoints]);

  // Identify Breached Zones
  const breachedZoneNames = alerts
    .filter((a) => a.type === "GEOFENCE")
    .map((a) => a.zoneName);

  const defaultCenter = itineraryMarkers.length > 0 ? itineraryMarkers[0] : [0, 0];
  const defaultZoom = itineraryMarkers.length > 0 ? 12 : 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[550px] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 z-0 bg-[#050505]"
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%", background: "#050505" }}
        scrollWheelZoom={true}
        preferCanvas={true}
        zoomControl={false}
      >
        <FitBounds points={allPoints} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          updateWhenIdle={true}
        />

        {/* Strategic Vector (Path) */}
        {itineraryMarkers.length > 1 && (
          <Polyline 
            positions={itineraryMarkers} 
            pathOptions={{ color: '#6366f1', weight: 3, dashArray: '10, 10', opacity: 0.6 }} 
          />
        )}

        {itinerary.map((day, dIdx) =>
          (day.activities || []).map((act, aIdx) => {
            const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="relative"><div class="neon-pulse"></div><div class="neon-pin"></div></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            });

            return (
              <Marker 
                key={`act-${dIdx}-${aIdx}`} 
                position={[act.lat, act.lon]}
                icon={customIcon}
              >
                <Popup minWidth={250}>
                  <div className="p-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Day {day.day} • {act.time}</span>
                    </div>
                    <h3 className="text-lg font-black tracking-tighter uppercase leading-none">{act.name}</h3>
                    <p className="text-xs text-white/60 leading-relaxed">{act.description}</p>
                    <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-400">Secure Destination Verified</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}

        {Object.entries(tourists).map(([id, loc]) => {
          const touristIcon = L.divIcon({
            className: 'tourist-beacon',
            html: `<div class="relative"><div class="w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(99,102,241,1)]"></div><div class="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-50"></div></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });
          return (
            <Marker
              key={id}
              position={[loc.lat, loc.lon]}
              icon={touristIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Live Asset Signal</p>
                  <p className="text-sm font-black tracking-tighter uppercase">Tourist ID: {id.slice(0, 8)}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {globalZones.map((z, i) => {
          const isBreached = breachedZoneNames.includes(z.name);
          return (
            <Circle
              key={i}
              center={[z.lat, z.lon]}
              radius={z.radius || 2000}
              pathOptions={{ 
                color: isBreached ? "#ef4444" : "#f59e0b", 
                fillOpacity: isBreached ? 0.4 : 0.05, 
                weight: isBreached ? 3 : 1,
                dashArray: isBreached ? null : "4 4"
              }}
              className={isBreached ? "animate-pulse" : ""}
            >
              <Popup>
                <div className="text-black">
                  <strong className="block mb-1 text-sm">{z.name}</strong>
                  <div className={`text-[10px] font-black uppercase ${isBreached ? 'text-red-600' : 'text-orange-600'}`}>
                    {isBreached ? "⚠️ BREACH DETECTED" : "Monitored Zone"}
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {sosAlerts.map((sos, i) => (
          <div key={`sos-group-${i}`}>
            <Circle
              center={[sos.lat, sos.lon]}
              radius={800}
              pathOptions={{ 
                color: 'red', 
                fillColor: '#ef4444', 
                fillOpacity: 0.3,
                dashArray: '10, 10',
                className: 'animate-pulse'
              }}
            />
            <Marker 
              position={[sos.lat, sos.lon]}
              icon={new L.Icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                iconSize: [35, 50],
                iconAnchor: [17, 50],
              })}
            >
              <Popup>
                <div className="text-black text-center p-2">
                  <div className="text-[8px] font-black uppercase text-red-600 mb-1 tracking-widest">🚨 SOS DISTRESS SIGNAL</div>
                  <strong className="block text-lg font-black tracking-tighter uppercase">{sos.name || "Unknown Tourist"}</strong>
                  <p className="text-[10px] opacity-60 mt-1">{new Date(sos.time).toLocaleTimeString()}</p>
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <p className="text-[9px] font-bold text-red-500 uppercase">Emergency Protocol Active</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}

        {wildernessAlerts.map((wa, i) => (
          <Circle
            key={`wilderness-${i}`}
            center={[wa.lat, wa.lon]}
            radius={1000}
            pathOptions={{ 
              color: '#f59e0b', 
              fillColor: '#f59e0b', 
              fillOpacity: 0.2,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div className="text-black text-center">
                <strong className="block mb-1 text-sm font-black text-amber-600">WILDERNESS BREACH</strong>
                <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold border border-amber-500 px-2 py-1 bg-amber-500/10 rounded">Rescue Grid Active</p>
              </div>
            </Popup>
          </Circle>
        ))}

        <RiskMapOverlay />
        {allPoints.length > 0 && <FitBounds points={allPoints} />}
      </MapContainer>
    </motion.div>
  );
}
