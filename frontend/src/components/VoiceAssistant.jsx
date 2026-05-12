import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function VoiceAssistant() {
  const { alerts } = useApp();
  const [isActive, setIsActive] = useState(false);
  const [lastReadAlert, setLastReadAlert] = useState(null);

  useEffect(() => {
    if (isActive && alerts.length > 0 && alerts[0] !== lastReadAlert) {
      const latest = alerts[0];
      let msg = "";
      
      const touristName = latest.name || latest.userId?.slice(0,4) || "a tourist";
      
      if (latest.type === 'SOS') {
        msg = `Code Red. Critical emergency alert. S O S signal received from ${touristName}. Deploying immediate tactical response protocol to their exact coordinates.`;
      } else if (latest.type === 'GEOFENCE') {
        msg = `Security Alert. Geofence perimeter breach detected. ${touristName} has crossed into a monitored high-risk zone. Standby for visual confirmation.`;
      } else {
        msg = `Tactical Update: ${latest.alert || latest.message}. Please maintain awareness of your surroundings.`;
      }
      
      speak(msg);
      setLastReadAlert(latest);
    }
  }, [alerts, isActive, lastReadAlert]);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Try to find a more premium sounding voice if available
    utterance.voice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 bg-indigo-600/20 backdrop-blur-3xl border border-indigo-500/30 p-6 rounded-3xl w-64 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">SHIELD AI Voice</p>
            </div>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              I am actively monitoring your environment. I will announce critical safety alerts and geofence breaches in real-time.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsActive(!isActive);
          if (!isActive) speak("SHIELD AI Voice Assistant is now active. I am actively monitoring your spatial surroundings, global danger zones, and live risk metrics. You are safe.");
          else window.speechSynthesis.cancel();
        }}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border ${
          isActive 
            ? "bg-indigo-600 border-indigo-400 shadow-indigo-500/40" 
            : "bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10"
        }`}
      >
        {isActive ? <Volume2 className="text-white" size={28} /> : <Mic className="text-indigo-400" size={28} />}
      </motion.button>
    </div>
  );
}
