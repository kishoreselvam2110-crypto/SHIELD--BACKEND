import { useState, useEffect } from 'react';
import { getLocationHistory } from '../utils/survivalDb';
import { ArrowUp, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function BacktrackOverlay({ currentLocation }) {
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState(null);
  const [heading, setHeading] = useState(0);

  const startBacktrack = async () => {
    const points = await getLocationHistory(500);
    setHistory(points);
    
    if (!points || points.length === 0) {
      toast.error("No movement history found. Unable to calculate backtrack vector.");
      return;
    }

    // Logic: Find the most recent point that was "safe" (online)
    const safePoint = points.slice().reverse().find(p => p.online) || points[0];
    
    if (safePoint) {
      setTarget(safePoint);
      setIsActive(true);
      speakGuidance("Tactical backtracking initiated. Follow the arrow to return to your last verified signal sector.");
      toast.success("Safe Point Locked! Vectoring to last known signal.");
    }
  };

  const speakGuidance = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (isActive && currentLocation && target) {
      // Calculate bearing from current to target
      const y = Math.sin(target.lon - currentLocation.lon) * Math.cos(target.lat);
      const x = Math.cos(currentLocation.lat) * Math.sin(target.lat) -
                Math.sin(currentLocation.lat) * Math.cos(target.lat) * Math.cos(target.lon - currentLocation.lon);
      const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      setHeading(brng);
    }
  }, [isActive, currentLocation, target]);

  return (
    <>
      <button 
        onClick={isActive ? () => setIsActive(false) : startBacktrack}
        onContextMenu={(e) => { e.preventDefault(); setTarget({ lat: currentLocation?.lat + 0.01, lon: currentLocation?.lon + 0.01 }); setIsActive(true); }}
        className={`fixed bottom-28 right-8 z-[1000] p-6 rounded-full shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all ${
          isActive ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white text-black hover:bg-white/90'
        }`}
      >
        <Navigation size={18} className={isActive ? 'animate-spin' : ''} />
        {isActive ? 'Stop Backtrack' : 'Backtrack to Safety'}
      </button>

      <AnimatePresence>
        {isActive && target && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] pointer-events-none"
          >
            <div className="relative">
              <div className="w-64 h-64 bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 flex items-center justify-center">
                 <motion.div 
                   animate={{ rotate: heading }}
                   transition={{ type: 'spring', stiffness: 50 }}
                   className="text-emerald-400"
                 >
                    <ArrowUp size={120} strokeWidth={3} />
                 </motion.div>
              </div>
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 text-center">
                <p className="text-white font-black uppercase tracking-widest text-xs">Head this way</p>
                <p className="text-white/40 text-[10px] font-bold uppercase mt-1">Target: Last Safe Signal</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
