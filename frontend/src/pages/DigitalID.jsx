import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { signProfile } from "../utils/cryptoId";
import Spinner from "../components/Spinner";

export default function DigitalID() {
  const [form, setForm] = useState({
    name: "",
    passport: "",
    destination: "",
    emergencyContact: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Feature 6: Cryptographically sign profile data offline
      const signedData = await signProfile(form);
      setResult(signedData);
    } catch (err) {
      console.error(err);
      setError("Failed to sign ID. Storage access required.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10"></div>
        
        <h2 className="text-4xl font-bold mb-2 text-center text-indigo-300 tracking-tight">Decentralized Tourist ID</h2>
        <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-8">Secured via Ed25519 Cryptographic Signatures</p>
        
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {["name", "passport", "destination", "emergencyContact"].map((field) => (
              <div key={field} className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold ml-1">
                  {field.replace(/([A-Z])/g, " $1")}
                </label>
                <input
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  required
                  placeholder={`Enter ${field}`}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-white/10 text-sm"
                />
              </div>
            ))}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center"
            >
              {loading ? <Spinner /> : "Generate Offline Signed ID"}
            </motion.button>
          </div>

          <div className="flex flex-col justify-center items-center">
            <div className="w-full h-full min-h-[300px] border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center relative bg-black/20 p-6">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="p-6 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                      <QRCodeCanvas 
                        value={JSON.stringify(result)} 
                        size={200}
                        level="L"
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-center w-full">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Offline Cryptographic Proof</p>
                      </div>
                      <p className="text-indigo-400 font-mono font-bold text-lg">Signature Valid</p>
                      <div className="mt-3 bg-black/40 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Public Key Hash</p>
                        <p className="text-[10px] text-white/60 font-mono break-all line-clamp-1">{result.publicKey}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-6 space-y-2"
                  >
                    <p className="text-indigo-200/40 text-sm">Waiting for secure identity data...</p>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Offline Verification Ready</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </form>

        {error && (
          <p className="mt-8 text-red-400 text-center bg-red-400/10 p-3 rounded-xl border border-red-400/20 text-sm">
            {error}
          </p>
        )}
      </motion.div>
      
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10 text-sm"
          >
            Download Secure ID
          </button>
        </motion.div>
      )}
    </div>
  );
}
