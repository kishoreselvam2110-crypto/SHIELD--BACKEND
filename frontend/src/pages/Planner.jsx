import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import MapView from "../components/MapView";
import Spinner from "../components/Spinner";
import { api } from "../utils/api";

export default function Planner() {
  const { setItinerary } = useApp();
  const [form, setForm] = useState({
    destination: "",
    days: 3,
    budget: "Medium",
    language: "English",
  });
  const [itinerary, setLocalItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState("");

  const phases = [
    "Establishing Uplink to SHIELD Network...",
    "Scanning Topographical Telemetry...",
    "Analyzing Geo-Spatial Risk Metrics...",
    "Optimizing Safe Navigational Vectors...",
    "Finalizing Secure Itinerary..."
  ];

  // Animate loading phases
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingPhase(p => (p < 4 ? p + 1 : p));
      }, 800);
    } else {
      setLoadingPhase(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(api("/api/smart-trip"), form);
      if (data && data.itinerary) {
        setLocalItinerary(data);
        setItinerary(data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setError("Trip generation failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl"
      >
        <h2 className="text-3xl font-bold mb-8 text-indigo-300 tracking-tight">Smart Trip Planner</h2>
        
        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold ml-1">Destination</label>
            <input
              name="destination"
              placeholder="e.g. Goa, India"
              value={form.destination}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold ml-1">Days</label>
            <input
              name="days"
              type="number"
              min={1}
              value={form.days}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold ml-1">Budget</label>
            <select
              name="budget"
              value={form.budget}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            >
              <option className="bg-gray-900">Low</option>
              <option className="bg-gray-900">Medium</option>
              <option className="bg-gray-900">High</option>
              <option className="bg-gray-900">Luxury</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-black transition-all shadow-lg flex justify-center items-center gap-2 overflow-hidden relative ${loading ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
          >
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="absolute inset-0 bg-emerald-500/10 blur-xl animate-pulse" />
                <span className="text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 relative z-10">
                   <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                   {phases[loadingPhase]}
                </span>
              </div>
            ) : "Initialize AI Protocol"}
          </motion.button>
        </form>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-center text-sm"
          >
            {error}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {itinerary && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Tactical Route Visualization Map */}
            <div className="relative h-[550px] w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-4 shadow-2xl overflow-hidden group">
              <div className="absolute top-8 left-10 z-20 pointer-events-none">
                 <div className="bg-black/80 backdrop-blur-xl border border-white/20 px-6 py-2.5 rounded-full flex items-center gap-3 shadow-2xl">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Tactical Satellite Vector</span>
                 </div>
              </div>
              <div className="h-full w-full rounded-[2.5rem] overflow-hidden">
                <MapView itinerary={itinerary.itinerary} />
              </div>
            </div>

            {itinerary.summary && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid md:grid-cols-4 gap-6"
              >
                <div className="md:col-span-3 p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -z-10" />
                  <p className="text-sm md:text-base text-indigo-100 leading-relaxed italic">
                    <span className="font-black uppercase tracking-[0.2em] text-[10px] block mb-3 not-italic text-indigo-400 opacity-60">Strategic Overview</span>
                    "{itinerary.summary}"
                  </p>
                </div>
                
                <div className="md:col-span-1 p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-50" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-2">AI Risk Engine</p>
                  <div className="text-5xl font-black text-white flex items-baseline">
                    98<span className="text-lg text-emerald-500/80">/100</span>
                  </div>
                  <p className="text-xs text-emerald-200 mt-2 font-bold">Safety Score</p>
                  <p className="text-[8px] text-emerald-400/60 uppercase tracking-tighter mt-1">Route Verified Secure</p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(itinerary.itinerary || []).map((day, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                  
                  <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] h-full flex flex-col shadow-xl hover:shadow-indigo-500/10 transition-all border-b-4 border-b-indigo-500/30">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-500/30 text-white">
                          {day.day}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">Day {day.day}</h3>
                          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">{day.theme || "Exploration"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase font-black text-white/20 mb-1">Safety Index</p>
                        <div className="flex gap-1 justify-end">
                          {[1,2,3,4,5].map(s => (
                            <div key={s} className={`w-1.5 h-3 rounded-full ${s <= 4 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8 flex-1 relative">
                      {(day.activities || []).map((act, aIdx) => (
                        <div key={aIdx} className="flex gap-6 relative">
                          {aIdx !== (day.activities.length - 1) && (
                            <div className="absolute left-[9px] top-8 w-[2px] h-12 bg-gradient-to-b from-indigo-500/40 to-transparent" />
                          )}
                          <div className="w-5 h-5 rounded-full border-4 border-indigo-500/30 mt-1.5 shrink-0 bg-[#050505] shadow-inner" />
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">{act.time}</span>
                              <h4 className="font-bold text-sm text-indigo-100 group-hover:text-white transition-colors">{act.name}</h4>
                            </div>
                            <p className="text-white/40 text-xs leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">{act.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-bold uppercase tracking-tighter">Verified Route</span>
                      <div className="flex gap-2">
                         <div className="w-4 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold">📶</div>
                         <div className="w-4 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold">🛡️</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
