import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { verifyProfile } from "../utils/cryptoId";
import { ShieldCheck, ShieldAlert, Camera, X } from "lucide-react";

export default function VerifyID() {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        let decodedData;
        try {
          decodedData = decodeURIComponent(dataParam);
          // Check if it's valid JSON, if not, try atob
          JSON.parse(decodedData);
        } catch {
          decodedData = atob(dataParam);
        }
        handleVerify(decodedData);
      } catch (err) {
        console.error("URL Data Parse Error:", err);
        setError("Scanning Error: The QR data is corrupted or incompatible. Try generating a new ID.");
      }
    }
  }, [searchParams]);

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
            className="glass-card p-8 md:p-12 rounded-[3rem] border border-emerald-500/30 relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10"></div>
            
            <div className="flex justify-between items-start mb-10">
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full w-fit">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-[8px] font-black uppercase text-emerald-400 tracking-[0.2em]">Authenticity Verified</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter text-white mt-2">Tourist Identity</h2>
               </div>
               <button onClick={() => setScanResult(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
                  <X size={20} />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {['name', 'passport', 'aadhaar', 'destination', 'emergencyContact'].map(key => (
                <div key={key} className={`p-5 bg-white/5 border border-white/10 rounded-2xl ${key === 'name' ? 'md:col-span-2 bg-indigo-500/10 border-indigo-500/20' : ''}`}>
                  <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${key === 'name' ? 'text-indigo-400' : 'text-white/30'}`}>
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className={`font-bold ${key === 'name' ? 'text-2xl text-white' : 'text-lg text-white/90'}`}>
                    {scanResult[key]}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-6">
               <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <ShieldCheck size={32} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Security Status</p>
                  <p className="text-sm font-bold text-emerald-100/80 leading-tight">Cryptographically Signed & Verified. This tourist is registered in the National Security Gateway.</p>
               </div>
            </div>

            <div className="mt-8 text-center">
               <p className="text-[8px] font-black uppercase text-white/10 tracking-[0.3em]">SHIELD AI • MINISTRY OF TOURISM</p>
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
