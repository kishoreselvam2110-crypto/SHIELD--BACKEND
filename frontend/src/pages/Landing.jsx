import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Map, QrCode, Compass, Heart, ShieldCheck, Sun, Trees } from "lucide-react";
import { useState, useEffect } from "react";
import SafetyScore from "../components/SafetyScore";
import SoftSafetyFeatures from "../components/SoftSafetyFeatures";

export default function Landing() {
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [battery, setBattery] = useState(100);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setLocation({ lat: 18.5204, lon: 73.8567 }) // Default fallback
    );

    if ('getBattery' in navigator) {
      navigator.getBattery().then(bat => {
        setBattery(Math.round(bat.level * 100));
        bat.addEventListener('levelchange', () => setBattery(Math.round(bat.level * 100)));
      });
    }
  }, []);

  return (
    <section className="relative min-h-[85vh] overflow-hidden flex flex-col items-center justify-center p-8">
      {/* Vibrant Tourist Background */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-500/20 blur-[150px] rounded-full animate-float" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/20 blur-[150px] rounded-full animate-float" style={{ animationDelay: '3s' }} />
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/20 blur-[150px] rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center space-y-8 max-w-4xl"
      >
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          className="inline-block"
        >
           <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl">
              <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India Flag" className="w-6 h-4 rounded-sm shadow-sm border border-white/20 object-cover" /> 
              Welcome to the Tourist Portal
           </div>
        </motion.div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
          Travel <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent italic">Smart.</span>
          <br/>Travel <span className="text-emerald-400">Safe.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-medium tracking-wide leading-relaxed">
          Your personal AI companion for exploring the world securely. We monitor the risks, so you can enjoy the view.
        </p>
          
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          <Link to="/planner">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(249, 115, 22, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full font-black text-lg hover:from-orange-400 hover:to-pink-400 transition-all shadow-2xl flex items-center gap-3 text-white"
            >
              <Compass size={24} />
              Plan My Trip
            </motion.button>
          </Link>
          <Link to="/digital-id">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 255, 255, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full font-black text-lg hover:bg-white/20 transition-all shadow-2xl flex items-center gap-3 text-white"
            >
              <QrCode size={24} />
              Get Digital ID
            </motion.button>
          </Link>
          <Link to="/wilderness">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(16, 185, 129, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-emerald-500/10 backdrop-blur-3xl border border-emerald-500/20 rounded-full font-black text-lg hover:bg-emerald-500/20 transition-all shadow-2xl flex items-center gap-3 text-emerald-400"
            >
              <Trees size={24} />
              Wilderness Mode
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* New Modular Features Section */}
      <div className="mt-24 max-w-6xl w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <SafetyScore 
            lat={location.lat} 
            lon={location.lon} 
            batteryLevel={battery} 
            tripStatus="active" 
          />
        </div>
        <div className="lg:col-span-8">
          <SoftSafetyFeatures />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl w-full relative z-10">
        {[
          { icon: <Map size={32} className="text-pink-400" />, title: "AI Planner", desc: "Custom itineraries curated by advanced AI for your safety and enjoyment." },
          { icon: <Heart size={32} className="text-orange-400" />, title: "Live Safety Network", desc: "Real-time alerts and dynamic geofencing keep you away from danger zones." },
          { icon: <ShieldCheck size={32} className="text-emerald-400" />, title: "Verified Identity", desc: "Instant QR-based tourist identification for seamless interactions with authorities." }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + (0.2 * i), type: "spring", stiffness: 100 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all shadow-2xl group"
          >
            <div className="p-4 bg-white/5 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-transform shadow-lg">
               {feat.icon}
            </div>
            <h3 className="text-2xl font-black mb-3 text-white">{feat.title}</h3>
            <p className="text-white/60 font-medium leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
