import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

export default function SafetyAlert() {
  const { alerts } = useApp();
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    if (alerts.length > 0) {
      setActiveAlert(alerts[0]);
      const timer = setTimeout(() => setActiveAlert(null), 10000); // 10s visibility
      return () => clearTimeout(timer);
    }
  }, [alerts]);

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xl"
        >
          <div className={`relative overflow-hidden bg-black/80 backdrop-blur-3xl border-2 ${activeAlert.type === 'SOS' ? 'border-red-500/50' : 'border-amber-500/50'} p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
            {/* Animated Glow Background */}
            <div className={`absolute inset-0 opacity-20 animate-pulse ${activeAlert.type === 'SOS' ? 'bg-red-500' : 'bg-amber-500'} blur-[100px] -z-10`} />
            
            <div className="flex items-start gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${activeAlert.type === 'SOS' ? 'bg-red-500 shadow-red-500/40' : 'bg-amber-500 shadow-amber-500/40'} shadow-lg text-white`}>
                {activeAlert.type === 'SOS' ? <ShieldAlert size={32} strokeWidth={2.5} /> : <AlertTriangle size={32} strokeWidth={2.5} />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-black uppercase tracking-tighter text-xl ${activeAlert.type === 'SOS' ? 'text-red-400' : 'text-amber-400'}`}>
                    {activeAlert.type === 'SOS' ? 'Emergency SOS Triggered' : 'Geofence Breach Detected'}
                  </h3>
                  <button onClick={() => setActiveAlert(null)} className="text-white/20 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-white font-bold leading-tight text-lg">
                  {activeAlert.alert || activeAlert.message}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-0.5 rounded text-white/60">
                    Location: {activeAlert.lat?.toFixed(4)}, {activeAlert.lon?.toFixed(4)}
                  </span>
                  <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-0.5 rounded text-white/60">
                    {new Date(activeAlert.time).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Scanning Line Animation */}
            <motion.div 
              initial={{ left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
