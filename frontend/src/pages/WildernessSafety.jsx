import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trees, ShieldAlert, Navigation, Radio, Users, Zap } from "lucide-react";
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
  const [autoRecenter, setAutoRecenter] = useState(true);

  useEffect(() => {
    const stopRecenter = () => setAutoRecenter(false);
    map.on("dragstart", stopRecenter);
    map.on("zoomstart", stopRecenter);
    return () => {
      map.off("dragstart", stopRecenter);
      map.off("zoomstart", stopRecenter);
    };
  }, [map]);

  useEffect(() => {
    if (autoRecenter && center) map.setView(center, 15);
  }, [center, map, autoRecenter]);
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
        console.error("Geofence start error:", err);
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
        console.error("Geofence stop error:", err);
        toast.error("Deactivation failed.");
      }
    }
  };

  const distance = useMemo(() => {
    if (!location || !startPos) return 0;
    return Math.round(L.latLng(location.lat, location.lon).distanceTo(L.latLng(startPos.lat, startPos.lon)));
  }, [location, startPos]);

  return (
    <div className="px-4 py-8 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 md:pb-32">
      <AnimatePresence>
        {isDanger && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md bg-red-600/95 backdrop-blur-xl border border-red-400 p-4 rounded-[2.5rem] shadow-2xl flex items-center gap-4"
            role="alert"
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
            className="fixed inset-0 z-[2000] bg-red-950/60 backdrop-blur-md flex items-center justify-center p-6 md:p-12"
            role="alert"
          >
             <div className="bg-red-600 border-4 border-white p-8 md:p-16 rounded-[3rem] md:rounded-[5rem] text-center shadow-[0_0_100px_rgba(255,0,0,1)] animate-bounce relative max-w-2xl">
                <ShieldAlert size={80} className="mx-auto text-white mb-6 md:mb-10" />
                <h2 className="text-4xl md:text-7xl font-black text-white mb-4 md:mb-6 italic tracking-tighter uppercase">EVACUATE AREA!</h2>
                <div className="space-y-4 mb-8 md:mb-12">
                   <p className="text-white font-black text-xl md:text-3xl uppercase tracking-widest">Critical Density: {nearbyCount} People</p>
                   <p className="text-red-100 max-w-md mx-auto text-sm md:text-base font-medium">Police HQ notified. Potential stampede risk detected. Move to open ground immediately.</p>
                </div>
                <button 
                  onClick={() => setDemoMode(false)}
                  aria-label="Clear Evacuation Alert"
                  className="px-10 py-4 bg-white text-red-600 rounded-full font-black uppercase tracking-[0.2em] text-sm md:text-base hover:bg-red-50 transition-colors shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50"
                >
                   Clear Alert
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="text-center space-y-6 relative max-w-4xl mx-auto">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] text-emerald-400 shadow-lg shadow-emerald-500/5"
        >
          <Trees size={56} />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase italic">WILDERNESS <span className="text-emerald-500">MODE</span></h1>
          <p className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] leading-relaxed">Live geofencing and search-and-rescue monitoring.</p>
        </div>
        
        {/* Demo Mode Toggle */}
        <button 
          onClick={() => setDemoMode(!demoMode)}
          aria-pressed={demoMode}
          className={`absolute -top-4 -right-4 md:top-0 md:right-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl ${
            demoMode ? 'bg-red-500 text-white shadow-red-500/40' : 'bg-white/5 text-white/40 border border-white/5'
          }`}
        >
          {demoMode ? 'Stop Threat Test' : 'Test Crowd Threat'}
        </button>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
           <Link to="/wilderness-aid" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-4 hover:bg-white/10 transition-all group focus:outline-none focus:ring-2 focus:ring-white/20">
              <HeartPulse size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-[0.1em] text-white">First Aid Guide</span>
           </Link>
           <button 
              onClick={startBluetoothSOS}
              aria-label="Broadcast Bluetooth SOS"
              className={`px-8 py-4 border rounded-2xl flex items-center justify-center gap-4 transition-all focus:outline-none focus:ring-2 ${isBluetoothSOSActive ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            >
               <Radio size={20} className={isBluetoothSOSActive ? 'animate-bounce' : ''} />
               <span className="text-xs font-black uppercase tracking-[0.1em]">
                  {isBluetoothSOSActive ? 'SOS BROADCASTING' : 'Bluetooth SOS'}
               </span>
               {!isOnline && <span className="px-1.5 py-0.5 bg-red-500 text-[8px] rounded font-black uppercase tracking-tighter">Offline</span>}
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        {/* Left: Map & Controls */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[4rem] p-4 h-[450px] md:h-[650px] shadow-2xl relative overflow-hidden group">
            {!location ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <Navigation className="animate-spin text-emerald-400" size={48} />
                <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">Locking Satellite Position...</p>
              </div>
            ) : (
              <MapContainer 
                center={[location.lat, location.lon]} 
                zoom={15} 
                className="w-full h-full rounded-[2rem] md:rounded-[3rem] opacity-90"
                zoomControl={false}
                preferCanvas={true}
              >
                <TileLayer 
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapRecenter center={[location.lat, location.lon]} />
                
                <Marker position={[location.lat, location.lon]} />
                
                {startPos && (
                  <Circle 
                    center={[startPos.lat, startPos.lon]} 
                    radius={1000} 
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, dashArray: '10, 10' }} 
                  />
                )}

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
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] w-full px-8 md:px-12">
              <button 
                onClick={toggleTracking}
                aria-label={isTracking ? "Deactivate Geofence" : "Establish Geofence"}
                className={`w-full py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] font-black text-lg md:text-2xl transition-all flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-white/20 ${
                  isTracking 
                    ? 'bg-red-600 text-white shadow-red-900/40' 
                    : 'bg-emerald-500 text-black shadow-emerald-900/40'
                }`}
              >
                {isTracking ? <ShieldAlert size={32} /> : <Zap size={32} />}
                <span className="tracking-tighter">{isTracking ? "DEACTIVATE GEOFENCE" : "ESTABLISH GEOFENCE"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className={`p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border transition-all shadow-2xl ${isTracking ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex justify-between items-start mb-8">
               <div className={`p-4 rounded-[1.5rem] ${isTracking ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                  <Navigation size={28} />
               </div>
               <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${isTracking ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/20'}`}>
                  {isTracking ? "Grid Active" : "Grid Offline"}
               </span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Sector Perimeter</h3>
            <p className="text-white/40 text-xs font-bold leading-relaxed">Monitoring 1,000m safe radius from extraction point.</p>
            
            {isTracking && (
              <div className="mt-10 space-y-5">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Telemetry Range</span>
                  <span className="text-3xl font-mono text-white tracking-tighter">{distance}m</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((distance / 1000) * 100, 100)}%` }}
                    className={`h-full transition-colors ${distance > 800 ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_20px_#10b981]'}`}
                   />
                </div>
              </div>
            )}
          </div>

          <div className={`p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group transition-all ${isTracking ? 'bg-indigo-600 border border-indigo-400/30' : 'bg-white/5 border border-white/10'}`}>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-[1.5rem] ${isTracking ? 'bg-white/20 text-white' : 'bg-white/5 text-white/20'}`}>
                    <Users size={28} />
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isTracking ? 'bg-white/20 text-white' : 'bg-white/5 text-white/20'}`}>
                   {isTracking ? "Live Feed" : "Standby"}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className={`text-6xl font-black tracking-tighter ${isTracking ? 'text-white' : 'text-white/20'}`}>{nearbyCount}</h3>
                <span className={`text-sm font-black uppercase tracking-tighter ${isTracking ? 'text-white/60' : 'text-white/20'}`}>Units</span>
              </div>
              <p className={`font-black uppercase tracking-widest text-xs ${isTracking ? 'text-white' : 'text-white/40'}`}>Perimeter Density</p>
              <p className={`text-xs mt-4 leading-relaxed font-medium ${isTracking ? 'text-white/80' : 'text-white/20'}`}>
                {isTracking 
                  ? `Tactical analysis confirms ${nearbyCount} units within your active safe zone.` 
                  : "Initialize geofence protocols to begin sector tracking."}
              </p>
            </div>
            <Users className={`absolute bottom-[-10%] right-[-10%] w-40 h-40 rotate-12 transition-opacity ${isTracking ? 'text-white/10' : 'text-white/5'}`} aria-hidden="true" />
          </div>

          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 space-y-8 shadow-2xl">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Signal Stream</h4>
             </div>
             <div className="space-y-4">
                {alerts.slice(0, 3).map((a, i) => (
                  <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-5 group hover:bg-white/10 transition-colors">
                    <div className={`w-1.5 h-10 rounded-full shrink-0 ${a.type === 'SOS' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-xs truncate group-hover:whitespace-normal transition-all">{a.alert}</p>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-2">{new Date(a.time).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center py-10 space-y-4">
                     <div className="w-12 h-12 border-2 border-white/5 rounded-full mx-auto flex items-center justify-center">
                        <Radio size={20} className="text-white/10" />
                     </div>
                     <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">Scanning sector frequencies...</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
      <BacktrackOverlay currentLocation={location} />
    </div>
  );
}

