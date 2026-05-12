import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { verifyProfile } from "../utils/cryptoId";
import { ShieldCheck, ShieldAlert, Camera, X } from "lucide-react";

export default function VerifyID() {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualInput, setManualInput] = useState("");

  const handleVerify = (dataStr) => {
    try {
      const data = JSON.parse(dataStr);
      const isValid = verifyProfile(data);
      if (isValid) {
        setScanResult(data);
        setError("");
      } else {
        setError("Invalid Cryptographic Signature. This ID may be forged.");
      }
    } catch (err) {
      setError("Failed to parse ID data. Ensure it's a SHIELD AI Signed ID.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Officer Verification</h1>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Offline Cryptographic Trust Engine</p>
      </header>

      <div className="space-y-6">
        {!scanResult ? (
          <div className="space-y-4">
             <div 
                className="aspect-square bg-white/5 border-4 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                onClick={() => setIsScanning(true)}
              >
                <Camera size={48} className="text-white/20 group-hover:text-white/60 transition-colors" />
                <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Tap to Open Scanner</p>
             </div>

             <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase font-black"><span className="bg-[#050505] px-4 text-white/20 tracking-widest">Or Enter Data Manually</span></div>
             </div>

             <div className="space-y-2">
                <textarea 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste Signed JSON Data Here..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-mono outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button 
                  onClick={() => handleVerify(manualInput)}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/90 transition-all"
                >
                  Verify Digital Signature
                </button>
             </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white/5 backdrop-blur-2xl border ${scanResult ? 'border-emerald-500/30' : 'border-red-500/30'} p-10 rounded-[4rem] shadow-2xl`}
          >
            <div className="flex justify-between items-start mb-8">
               <div className={`p-4 rounded-3xl ${scanResult ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  <ShieldCheck size={32} />
               </div>
               <button onClick={() => setScanResult(null)} className="p-2 text-white/20 hover:text-white">
                  <X size={20} />
               </button>
            </div>

            <h2 className="text-3xl font-black mb-1">Identity Verified</h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-10">Authenticity Guaranteed via SHIELD AI Trust Engine</p>

            <div className="space-y-4">
              {['name', 'passport', 'destination', 'emergencyContact'].map(key => (
                <div key={key} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest mb-1">{key.replace(/([A-Z])/g, " $1")}</p>
                  <p className="text-lg font-bold">{scanResult[key]}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
               <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest mb-1">Status</p>
               <p className="text-xs font-bold text-emerald-100">Safe / No active alerts for this tourist.</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400"
          >
            <ShieldAlert size={20} />
            <p className="text-xs font-bold">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
