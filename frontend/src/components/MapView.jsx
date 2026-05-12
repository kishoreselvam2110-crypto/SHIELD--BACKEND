import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
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

  useEffect(() => {
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
  }, [map, points]);
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
  const itineraryMarkers = (itinerary || [])
    .flatMap((day) => day.activities || [])
    .filter(a => a.lat && a.lon)
    .map((a) => [a.lat, a.lon]);

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

  const touristPoints = Object.values(tourists).map((t) => [t.lat, t.lon]);
  
  const sosAlerts = alerts.filter(a => a.type === 'SOS' && a.lat && a.lon);
  const wildernessAlerts = alerts.filter(a => (a.type === 'WILDERNESS_BREACH' || a.type === 'WILDERNESS_EXPIRED') && a.lat && a.lon);
  
  const sosPoints = sosAlerts.map(a => [a.lat, a.lon]);
  const wildernessPoints = wildernessAlerts.map(a => [a.lat, a.lon]);
  
  const allPoints = [...itineraryMarkers, ...touristPoints, ...sosPoints, ...wildernessPoints];

  // Identify Breached Zones
  const breachedZoneNames = alerts
    .filter((a) => a.type === "GEOFENCE")
    .map((a) => a.zoneName);

  const defaultCenter = itineraryMarkers.length > 0 ? itineraryMarkers[0] : [20.5937, 78.9629];
  const defaultZoom = itineraryMarkers.length > 0 ? 12 : 5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[550px] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 z-0"
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%", background: "#050505" }}
        scrollWheelZoom={true}
      >
        {mapStyle === "tactical" && (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        )}
        {mapStyle === "colorful" && (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        )}
        {mapStyle === "hybrid" && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            />
          </>
        )}

        {itinerary.map((day, dIdx) =>
          (day.activities || []).map((act, aIdx) => (
            <Marker key={`act-${dIdx}-${aIdx}`} position={[act.lat, act.lon]}>
              <Popup>
                <div className="text-black text-sm">
                  <strong className="block mb-1">{act.name}</strong>
                  <p className="opacity-70 leading-tight">{act.description}</p>
                  <div className="mt-2 text-indigo-600 font-bold">{act.time}</div>
                </div>
              </Popup>
            </Marker>
          ))
        )}

        {Object.entries(tourists).map(([id, loc]) => (
          <Marker
            key={id}
            position={[loc.lat, loc.lon]}
            icon={new L.Icon({
              iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup><div className="text-black font-bold uppercase tracking-widest text-[10px]">Tourist: {id}</div></Popup>
          </Marker>
        ))}

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
          <Circle
            key={`sos-${i}`}
            center={[sos.lat, sos.lon]}
            radius={800}
            pathOptions={{ 
              color: 'red', 
              fillColor: '#ef4444', 
              fillOpacity: 0.3,
              dashArray: '10, 10',
              className: 'animate-pulse'
            }}
          >
            <Popup>
              <div className="text-black text-center">
                <strong className="block mb-1 text-sm font-black text-red-600">CRITICAL SOS DETECTED</strong>
                <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold border border-red-500 px-2 py-1 bg-red-500/10 rounded">Emergency Geofence Engaged</p>
              </div>
            </Popup>
          </Circle>
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
