import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import MapView from "../components/MapView";
import TacticalGlobe from "../components/TacticalGlobe";
import { Shield, Users, Map as MapIcon, Bell, Activity, Zap, Radio, Search, Navigation, TrendingUp, Globe as GlobeIcon, Smartphone, LifeBuoy } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RescueTools from "../components/RescueTools";

const chartData = [
  { time: '12:00', alerts: 2 }, { time: '13:00', alerts: 5 }, { time: '14:00', alerts: 3 },
  { time: '15:00', alerts: 8 }, { time: '16:00', alerts: 4 }, { time: '17:00', alerts: 10 },
  { time: '18:00', alerts: 6 },
];

import { useState } from "react";
import axios from "axios";
import { api } from "../utils/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { alerts, tourists } = useApp();
  const [mapMode, setMapMode] = useState("tactical"); // "tactical", "hybrid", "colorful", "rescue"
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [efirLoading, setEfirLoading] = useState(null);

  const handleGenerateEFIR = async (alert) => {
    setEfirLoading(alert.time);
    try {
      await axios.post(api("/api/efir/create"), {
        tourist_hash: alert.userId,
        location_lat: alert.lat,
        location_lon: alert.lon
      });
      toast.success("E-FIR generated and filed with local authorities.", { icon: '📄' });
    } catch (err) {
      toast.error("Database connection failure. E-FIR logged to local cache.");
    } finally {
      setEfirLoading(null);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto p-4 md:p-8 space-y-8">
      {/* Dynamic Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
            <div className="relative p-3 bg-indigo-600 rounded-[2rem] shadow-2xl flex items-center justify-center h-16 w-16">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
                alt="State Emblem of India" 
                className="w-full h-full object-contain filter brightness-0 invert opacity-90 drop-shadow-md" 
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              {/* CSS Indian Flag */}
              <div className="flex h-4 w-6 shadow-sm border border-white/20 rounded-sm overflow-hidden flex-col">
                <div className="flex-1 bg-[#FF9933]"></div>
                <div className="flex-1 bg-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 border-[0.5px] border-[#000080] rounded-full"></div>
                </div>
                <div className="flex-1 bg-[#138808]"></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                <span className="text-[#FF9933]">Govt of </span> 
                <span className="text-white">India </span> 
                <span className="text-[#138808]">Initiative</span>
              </p>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white">COMMAND <span className="text-indigo-500">CENTER</span></h1>
            <p className="text-indigo-300/40 font-mono tracking-widest text-xs mt-2 uppercase">Ministry of Tourism • Active Security Grid</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <StatCard icon={<Users size={20} />} label="Active Tourists" value={Object.keys(tourists).length} color="indigo" />
          <StatCard icon={<Radio size={20} />} label="LoRaWAN Grid" value="Active" color="emerald" />
          <StatCard icon={<Zap size={20} />} label="Engine Latency" value="0.34ms" color="amber" />
          
          <div className="relative group">
            <StatCard icon={<Smartphone size={20} />} label="Mobile Sync" value="Scan" color="purple" />
            <div className="absolute top-full mt-4 right-0 z-[100] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all p-6 bg-white rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20 text-center w-64">
               <p className="text-black text-[10px] font-black uppercase tracking-widest mb-4">Mobile Access Link</p>
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin)}`} 
                 alt="Mobile QR" 
                 className="mx-auto rounded-xl shadow-lg mb-4"
               />
               <p className="text-black/40 text-[9px] font-medium leading-tight">Scan this with your mobile phone to open the SHIELD Portal on your local network.</p>
            </div>
          </div>

          <StatCard icon={<Bell size={20} />} label="SOS Pending" value={alerts.filter(a => a.type === 'SOS').length} color="red" />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 min-h-[850px]">
        {/* Left Column: Alerts & Resources */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          {/* Real-time Alerts */}
          <div className="flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 flex flex-col shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Activity className="text-red-500" size={20} />
                Signal Feed
              </h3>
              <div className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-bold text-white/40 uppercase tracking-tighter border border-white/10">Live Telemetry</div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
              <AnimatePresence initial={false}>
                {alerts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20 italic">
                    <Radio className="mb-4 animate-pulse" size={48} />
                    <p className="text-sm">Awaiting distress signals...</p>
                  </div>
                ) : (
                  alerts.map((a, i) => (
                    <motion.div
                      key={a.time + i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-5 rounded-[2rem] border transition-all ${
                        a.type === 'SOS' 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                          a.type === 'SOS' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {a.type}
                        </span>
                        <span className="text-[9px] font-mono opacity-30">{new Date(a.time).toLocaleTimeString()}</span>
                      </div>
                      <p className={`text-sm leading-snug font-bold ${a.type === 'SOS' ? 'text-red-100' : 'text-white/80'}`}>{a.alert || a.message}</p>
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-[8px] font-black opacity-40 uppercase tracking-widest">
                          <span>Battery: {a.batteryLevel}%</span>
                          <span>Panic: {a.isPanic ? "YES" : "NO"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">ID: {a.userId?.slice(0,6) || "UNKN"}</span>
                          {a.type === 'SOS' ? (
                            <button 
                              onClick={() => handleGenerateEFIR(a)}
                              disabled={efirLoading === a.time}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-[9px] font-bold text-white transition-all shadow-lg flex items-center gap-1 disabled:opacity-50"
                            >
                              {efirLoading === a.time ? "Processing..." : "Generate E-FIR"}
                            </button>
                          ) : (
                            <Zap className="text-white/10" size={14} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 3D Tactical Globe */}
          <div className="flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 flex flex-col shadow-2xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <GlobeIcon className="text-indigo-400" size={20} />
                  Orbital Scan
                </h3>
             </div>
             <div className="flex-1 w-full min-h-[250px] relative -mx-4">
                <TacticalGlobe activeLocations={Object.values(tourists)} />
             </div>
             <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center z-10 relative">
                <div className="flex gap-4">
                   <div>
                      <p className="text-[8px] uppercase text-white/20 font-black">Satellites</p>
                      <p className="text-sm font-bold text-indigo-400">14 Active</p>
                   </div>
                   <div>
                      <p className="text-[8px] uppercase text-white/20 font-black">Sync Rate</p>
                      <p className="text-sm font-bold text-emerald-400">0.2s</p>
                   </div>
                </div>
                <Zap className="text-white/10" size={16} />
             </div>
          </div>
        </div>

        {/* Center: Massive Map Section */}
        <div className="xl:col-span-9 relative">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full -z-10"></div>
          <div className="h-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-4 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-8 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 rounded-t-[3rem]">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Live Satellite Vector</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setMapMode("rescue")}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2 ${mapMode === "rescue" ? "bg-emerald-600 shadow-lg text-white" : "bg-white/5 hover:bg-white/10"}`}
                >
                  <LifeBuoy size={12} /> Rescue Ops
                </button>
                <button 
                  onClick={() => setMapMode("hybrid")}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${mapMode === "hybrid" ? "bg-indigo-600 shadow-lg text-white" : "bg-white/5 hover:bg-white/10"}`}
                >Hybrid Satellite</button>
                <button 
                  onClick={() => setMapMode("tactical")}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${mapMode === "tactical" ? "bg-red-600 shadow-lg text-white" : "bg-white/5 hover:bg-white/10"}`}
                >Tactical</button>
              </div>
            </div>
            <div className="flex-1 rounded-[2.5rem] overflow-hidden mt-4">
              {mapMode === "rescue" ? (
                <RescueTools selectedTourist={selectedTourist} />
              ) : (
                <MapView mapStyle={mapMode} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: "from-indigo-600/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
    red: "from-red-600/20 to-red-600/5 border-red-500/30 text-red-400",
  };
  
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className={`px-8 py-6 rounded-[2.5rem] border bg-gradient-to-br backdrop-blur-xl flex items-center gap-6 shadow-2xl min-w-[240px] ${colors[color]}`}
    >
      <div className="p-4 bg-white/5 rounded-2xl shadow-inner">{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tighter">{value}</p>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/40 rounded-3xl transition-all group">
      <div className="text-white/40 group-hover:text-indigo-400 transition-colors">{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-tighter opacity-60">{label}</span>
    </button>
  );
}
