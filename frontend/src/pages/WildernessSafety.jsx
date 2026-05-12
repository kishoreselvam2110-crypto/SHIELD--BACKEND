import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trees, ShieldAlert, CheckCircle, Navigation, Radio, Users, Map as MapIcon, Zap } from "lucide-react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { api } from "../utils/api";
import { useSurvivalManager } from "../hooks/useSurvivalManager";
import BacktrackOverlay from "../components/BacktrackOverlay";
import { HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function WildernessSafety() {
  const { user, tourists, alerts } = useApp();
  const { isOnline, isBluetoothSOSActive, startBluetoothSOS } = useSurvivalManager();
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [isDanger, setIsDanger] = useState(false);
  const [isCrowdThreat, setIsCrowdThreat] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Track location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watcher = navigator.geolocation.watchPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.error("Location failed", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watcher);
    }
  }, []);

  // Calculate nearby people and detect danger zones
  useEffect(() => {
    if (!location) return;
    
    // People Nearby logic (Inside the 1km Geofence)
    const activePerimeter = startPos || location;
    let nearby = Object.values(tourists).filter(t => {
      if (t.id === user?.id) return false;
      const d = L.latLng(activePerimeter.lat, activePerimeter.lon).distanceTo(L.latLng(t.lat, t.lon));
      return d < 1000; // 1km radius
    }).length;

    // Advanced: Demo mode adds 10,001 people for the threat alert test
    if (demoMode) nearby += 10005;

    setNearbyCount(nearby);

    // Crowd Threat Detection (>10,000 people)
    if (nearby > 10000) {
      setIsCrowdThreat(true);
      if (!isCrowdThreat) toast.error("🚨 THREAT ALERT: CRITICAL CROWD DENSITY DETECTED!");
    } else {
      setIsCrowdThreat(false);
    }

    // Danger Zone logic
    const inDanger = alerts.some(a => {
      if (!a.lat || !a.lon) return false;
      const d = L.latLng(location.lat, location.lon).distanceTo(L.latLng(a.lat, a.lon));
      return d < 2000; 
    });
    setIsDanger(inDanger);

  }, [location, tourists, alerts, user, demoMode, isCrowdThreat]);

  const toggleTracking = async () => {
    if (!location) {
      toast.error("Waiting for GPS signal...");
      return;
    }

    if (!isTracking) {
      try {
        const res = await fetch(api("/api/wilderness/start-timer"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id || "anonymous",
            name: user?.name || "Guest Tourist",
            durationMinutes: 1440, // 24 hours default for background tracking
            location: location
          })
        });
        if (res.ok) {
          setIsTracking(true);
          setStartPos(location);
          toast.success("Geofence Established! Your 1km Safe Zone is now active.");
        }
      } catch (err) {
        toast.error("Connection failed.");
      }
    } else {
      try {
        await fetch(api("/api/wilderness/check-in"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id || "anonymous" })
        });
        setIsTracking(false);
        setStartPos(null);
        toast.success("Tracking Deactivated. Safe journey!");
      } catch (err) {
        toast.error("Deactivation failed.");
      }
    }
  };

  const distance = useMemo(() => {
    if (!location || !startPos) return 0;
    return Math.round(L.latLng(location.lat, location.lon).distanceTo(L.latLng(startPos.lat, startPos.lon)));
  }, [location, startPos]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 pb-20">
      <AnimatePresence>
        {isDanger && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md bg-red-600/90 backdrop-blur-xl border border-red-400 p-4 rounded-[2rem] shadow-2xl flex items-center gap-4"
          >
            <div className="p-3 bg-white rounded-full text-red-600 animate-pulse">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-white font-black uppercase tracking-tighter text-sm">Danger Zone Detected</p>
              <p className="text-red-100 text-[10px] font-medium leading-tight">Unauthorized perimeter breach or SOS reported nearby. Proceed with caution.</p>
            </div>
          </motion.div>
        )}

        {isCrowdThreat && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[2000] bg-red-900/40 backdrop-blur-sm pointer-events-none flex items-center justify-center p-8"
          >
             <div className="bg-red-600 border-4 border-white p-12 rounded-[4rem] text-center shadow-[0_0_100px_rgba(255,0,0,0.8)] animate-bounce pointer-events-auto">
                <ShieldAlert size={80} className="mx-auto text-white mb-6" />
                <h2 className="text-5xl font-black text-white mb-4 italic tracking-tighter">EVACUATE AREA!</h2>
                <p className="text-white font-black text-xl uppercase">Critical Density: {nearbyCount} People</p>
                <p className="text-red-100 mt-4 max-w-xs mx-auto text-sm">Police HQ has been notified of potential stampede risk. Moving to open ground is advised.</p>
                <button 
                  onClick={() => setDemoMode(false)}
                  className="mt-8 px-8 py-3 bg-white text-red-600 rounded-full font-black uppercase tracking-widest text-xs"
                >
                   Clear Alert
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="text-center space-y-4 relative">
        <div className="inline-flex p-4 bg-emerald-500/20 rounded-3xl text-emerald-400">
          <Trees size={48} />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">WILDERNESS <span className="text-emerald-500">MODE</span></h1>
        
        {/* Demo Mode Toggle for Jury */}
        <button 
          onClick={() => setDemoMode(!demoMode)}
          className={`absolute top-0 right-0 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
            demoMode ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/5 text-white/40'
          }`}
        >
          {demoMode ? 'Stop Threat Test' : 'Test Crowd Threat'}
        </button>

        <p className="text-white/60 max-w-xl mx-auto font-medium">
          Live geofencing and search-and-rescue monitoring.
        </p>

        <div className="flex justify-center gap-4 mt-6">
           <Link to="/wilderness-aid" className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all">
              <HeartPulse size={18} className="text-red-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">First Aid Guide</span>
           </Link>
           <button 
              onClick={startBluetoothSOS}
              className={`px-6 py-3 border rounded-2xl flex items-center gap-3 transition-all ${isBluetoothSOSActive ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse' : 'bg-white/5 border-white/10 text-white/40'}`}
            >
               <Radio size={18} className={isBluetoothSOSActive ? 'animate-bounce' : ''} />
               <span className="text-[10px] font-black uppercase tracking-widest">
                  {isBluetoothSOSActive ? 'SOS BROADCASTING' : 'Simulate Bluetooth SOS'}
               </span>
               {!isOnline && <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-[8px] rounded font-bold uppercase">Offline</span>}
            </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Map & Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-4 h-[400px] md:h-[550px] shadow-2xl relative overflow-hidden group">
            {!location ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <Navigation className="animate-spin text-indigo-400" size={48} />
                <p className="text-white font-black uppercase tracking-widest text-xs">Locking Satellite Position...</p>
              </div>
            ) : (
              <MapContainer 
                center={[location.lat, location.lon]} 
                zoom={15} 
                className="w-full h-full rounded-[2.5rem] grayscale invert contrast-[1.2] brightness-50 opacity-80"
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapRecenter center={[location.lat, location.lon]} />
                
                {/* Current User */}
                <Marker position={[location.lat, location.lon]} />
                
                {/* Geofence Safe Zone */}
                {startPos && (
                  <Circle 
                    center={[startPos.lat, startPos.lon]} 
                    radius={1000} 
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, dashArray: '10, 10' }} 
                  />
                )}

                {/* Nearby Tourists */}
                {Object.values(tourists).filter(t => t.id !== user?.id).map((t, i) => (
                  <Circle 
                    key={i}
                    center={[t.lat, t.lon]}
                    radius={10}
                    pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 1 }}
                  />
                ))}
              </MapContainer>
            )}

            {/* Floating Control */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] w-full px-8">
              <button 
                onClick={toggleTracking}
                className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl ${
                  isTracking 
                    ? 'bg-red-500/80 text-white border border-red-400 shadow-red-500/30' 
                    : 'bg-emerald-500 text-black shadow-emerald-500/30'
                }`}
              >
                {isTracking ? <ShieldAlert size={24} /> : <Zap size={24} />}
                {isTracking ? "DEACTIVATE GEOFENCE" : "ESTABLISH GEOFENCE"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Geofence Status */}
          <div className={`p-8 rounded-[3rem] border transition-all ${isTracking ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-white/5 rounded-2xl text-emerald-400">
                  <Navigation size={24} />
               </div>
               <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${isTracking ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40'}`}>
                  {isTracking ? "Perimeter Active" : "Grid Offline"}
               </span>
            </div>
            <h3 className="text-xl font-black text-white mb-1">Grid Perimeter</h3>
            <p className="text-white/40 text-xs font-medium">Monitoring 1,000m safe range.</p>
            
            {isTracking && (
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Wander Range</span>
                  <span className="text-xl font-mono text-white">{distance}m</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((distance / 1000) * 100, 100)}%` }}
                    className={`h-full ${distance > 800 ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`}
                   />
                </div>
              </div>
            )}
          </div>

          {/* Density Status */}
          <div className={`p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group transition-all ${isTracking ? 'bg-indigo-600' : 'bg-white/5 border border-white/10'}`}>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${isTracking ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                    <Users size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isTracking ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20'}`}>
                   {isTracking ? "Live Tracking" : "Standby"}
                </div>
              </div>
              <h3 className={`text-4xl font-black ${isTracking ? 'text-white' : 'text-white/20'}`}>{nearbyCount}</h3>
              <p className={`font-black uppercase tracking-tighter text-sm ${isTracking ? 'text-white' : 'text-white/40'}`}>Perimeter Occupancy</p>
              <p className={`text-[10px] mt-2 leading-tight ${isTracking ? 'text-white/70' : 'text-white/20'}`}>
                {isTracking 
                  ? `There are currently ${nearbyCount} tourists moving within your 1,000m active geofence.` 
                  : "Establish a geofence to begin tracking sector occupancy."}
              </p>
            </div>
            <Users className={`absolute bottom-[-10%] right-[-10%] w-32 h-32 rotate-12 transition-opacity ${isTracking ? 'text-white/10' : 'text-white/5'}`} />
          </div>

          {/* Alert Signal Feed */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Local Signal Feed</h4>
             </div>
             <div className="space-y-3">
                {alerts.slice(0, 3).map((a, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                    <div className={`w-1 h-8 rounded-full ${a.type === 'SOS' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-white font-bold text-xs truncate w-40">{a.alert}</p>
                      <p className="text-[8px] text-white/30 font-mono mt-1">{new Date(a.time).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && <p className="text-center text-[10px] text-white/20 italic">No signals in this sector.</p>}
             </div>
          </div>
        </div>
      </div>
      <BacktrackOverlay currentLocation={location} />
    </div>
  );
}
