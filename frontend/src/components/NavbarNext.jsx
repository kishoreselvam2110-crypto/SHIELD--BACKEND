'use client';

import { Link } from 'react-router-dom'; // Note: In Next.js we use next/link, but for this hybrid we'll use standard a tags or next/link
import LinkNext from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, AlertCircle } from 'lucide-react';

export default function Navbar() {
  const [sosLoading, setSosLoading] = useState(false);

  const triggerSOS = async () => {
    if (!window.confirm("🚨 EMERGENCY: Trigger National Security Protocol?")) return;
    setSosLoading(true);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await axios.post('/api/sos', {
          userId: "me",
          name: "Live Tourist (Next-Gen)",
          location: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          message: "🚨 SIMULATED SOS: Next.js Platform Demo Active."
        });
        toast.success("SHIELD Signal Transmitted! Help is on the way.", { icon: '🛡️' });
      } catch (e) {
        toast.error("Signal Blocked.");
      } finally {
        setSosLoading(false);
      }
    }, () => setSosLoading(false), { timeout: 10000 });
  };

  return (
    <nav className="flex justify-between items-center px-10 py-6 sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/5">
      <LinkNext href="/" className="text-2xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors flex items-center gap-2">
        <Shield className="text-indigo-500" />
        SHIELD<span className="text-indigo-500">AI</span>
      </LinkNext>
      
      <div className="flex gap-8 items-center text-[10px] uppercase font-black tracking-widest">
        <LinkNext href="/admin" className="text-white/60 hover:text-white transition-colors">Control Center</LinkNext>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={triggerSOS}
          disabled={sosLoading}
          className="px-6 py-2 bg-red-600 rounded-full text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2"
        >
          {sosLoading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
          Emergency SOS
        </motion.button>
      </div>
    </nav>
  );
}
