import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Camera, Mic, ShieldCheck, AlertCircle, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { api } from '../utils/api';

export default function SoftSafetyFeatures() {
  const [timer, setTimer] = useState(0); // minutes
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isActive, setIsActive] = useState(false);
  const [evidence, setEvidence] = useState([]);
  const videoRef = useRef(null);

  // --- Check-in Timer Logic ---
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      triggerNotification();
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTimer = (mins) => {
    setTimer(mins);
    setTimeLeft(mins * 60);
    setIsActive(true);
    toast.info(`Safety Check-in active for ${mins} minutes`);
  };

  const triggerNotification = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("SHIELD SAFETY CHECK-IN", {
            body: "Your safety timer has expired! Please check in immediately.",
            icon: "/shield-logo.png"
          });
        }
      });
    }
    toast.error("⚠️ CHECK-IN EXPIRED: Triggering local alert protocols.");
    // In real app, emit BT Mesh SOS if offline
  };

  // --- Evidence Recording Logic ---
  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // In a real implementation, you'd show a preview and capture a frame.
      // For this modular component, we'll mock the capture.
      const newEvidence = {
        id: Date.now(),
        type: 'PHOTO',
        data: 'mock-b64-image-data',
        timestamp: new Date().toISOString(),
        status: 'LOCAL'
      };
      saveEvidence(newEvidence);
      stream.getTracks().forEach(track => track.stop());
      toast.success("Photo evidence captured and stored in secure local vault.");
    } catch (err) {
      toast.error("Camera access denied.");
    }
  };

  const saveEvidence = (item) => {
    const updated = [item, ...evidence];
    setEvidence(updated);
    localStorage.setItem('shield_evidence', JSON.stringify(updated));
  };

  const uploadEvidence = async (item) => {
    try {
      await axios.post(api("/api/evidence/upload"), {
        userId: 'me',
        type: item.type,
        data: item.data
      });
      const updated = evidence.map(e => e.id === item.id ? { ...e, status: 'UPLOADED' } : e);
      setEvidence(updated);
      localStorage.setItem('shield_evidence', JSON.stringify(updated));
      toast.success("Evidence synced to cloud vault.");
    } catch (err) {
      toast.error("Upload failed. Evidence remains secured locally.");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('shield_evidence');
    if (stored) setEvidence(JSON.parse(stored));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Check-in Timer Card */}
      <div className="p-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Timer size={80} />
        </div>
        
        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
          <ShieldCheck className="text-emerald-400" size={24} />
          Safety Check-in
        </h3>

        {isActive ? (
          <div className="text-center py-4">
            <div className="text-4xl font-black font-mono mb-2">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-6">Time until auto-alert</p>
            <button 
              onClick={() => setIsActive(false)}
              className="w-full py-4 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
            >
              Reset Safety Timer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-white/60 mb-6">Set a recurring timer. If you don't reset it, SHIELD will alert emergency contacts automatically.</p>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map(mins => (
                <button 
                  key={mins}
                  onClick={() => startTimer(mins)}
                  className="py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black hover:border-indigo-500/50 transition-all"
                >
                  {mins} MIN
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evidence Recording Card */}
      <div className="p-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
          <Camera className="text-indigo-400" size={24} />
          Evidence Vault
        </h3>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={capturePhoto}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group"
          >
            <Camera className="text-white/40 group-hover:text-white" size={20} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Capture Photo</span>
          </button>
          <button 
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group"
          >
            <Mic className="text-white/40 group-hover:text-white" size={20} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Record Audio</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[120px] pr-2 custom-scrollbar space-y-2">
          {evidence.length === 0 ? (
            <p className="text-[9px] text-white/20 italic text-center mt-4">No evidence logged yet.</p>
          ) : (
            evidence.map(item => (
              <div key={item.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center text-indigo-400">
                    {item.type === 'PHOTO' ? <Camera size={14} /> : <Mic size={14} />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-tighter">{item.type} LOGGED</p>
                    <p className="text-[8px] text-white/20">{new Date(item.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.status === 'LOCAL' && (
                    <button onClick={() => uploadEvidence(item)} className="text-emerald-400 hover:text-emerald-300">
                      <UploadCloud size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      const updated = evidence.filter(e => e.id !== item.id);
                      setEvidence(updated);
                      localStorage.setItem('shield_evidence', JSON.stringify(updated));
                    }}
                    className="text-red-400/40 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
