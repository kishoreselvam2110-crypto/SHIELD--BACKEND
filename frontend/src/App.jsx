import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { api } from "./utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AppProvider, useApp } from "./context/AppContext";
import { Toaster, toast } from "sonner";
import { Menu, X, Shield, Map as MapIcon, Calendar, User, ShieldAlert, AlertTriangle } from "lucide-react";

import Landing from "./pages/Landing";
import Planner from "./pages/Planner";
import DigitalID from "./pages/DigitalID";
import VerifyID from "./pages/VerifyID";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import VoiceAssistant from "./components/VoiceAssistant";
import SafetyAlert from "./components/SafetyAlert";
import WildernessSafety from "./pages/WildernessSafety";
import WildernessAid from "./pages/WildernessAid";

import "./App.css";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/home" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/planner" element={<PageWrapper><Planner /></PageWrapper>} />
        <Route path="/digital-id" element={<PageWrapper><DigitalID /></PageWrapper>} />
        <Route path="/verify/:id" element={<PageWrapper><VerifyID /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
        <Route path="/wilderness" element={<PageWrapper><WildernessSafety /></PageWrapper>} />
        <Route path="/wilderness-aid" element={<PageWrapper><WildernessAid /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function Navbar() {
  const { socket } = useApp();
  const [sosLoading, setSosLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const triggerSOS = async () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("National Security Protocol Initiated. Transmitting SOS signal.");
      window.speechSynthesis.speak(msg);
    }

    document.body.style.backgroundColor = "red";
    setTimeout(() => document.body.style.backgroundColor = "", 100);
    setTimeout(() => document.body.style.backgroundColor = "red", 200);
    setTimeout(() => document.body.style.backgroundColor = "", 300);

    const useSimulated = !window.location.protocol.includes('https') && !window.location.hostname.includes('localhost');
    
    let confirmMsg = "🚨 EMERGENCY: Trigger National Security Protocol?";
    if (useSimulated) confirmMsg += "\n\n(Note: Using simulated location because this connection is not HTTPS)";
    
    if (!window.confirm(confirmMsg)) return;
    setSosLoading(true);
    
    const sendSos = async (lat, lon, isSimulated = false) => {
      try {
        const payload = {
          userId: "me",
          name: "Live Tourist (Demo Mode)",
          location: { lat, lon },
          message: isSimulated 
            ? "🚨 SIMULATED SOS: Browser GPS blocked on HTTP. Using Demo Coordinates."
            : "🚨 EMERGENCY SOS: Immediate assistance required!"
        };
        await axios.post(api("/api/sos"), payload);
        toast.success(isSimulated ? "Simulated Signal Transmitted!" : "SHIELD Signal Transmitted!", { icon: '🛡️' });
      } catch (e) {
        toast.error("Network Error: Signal blocked.");
      } finally {
        setSosLoading(false);
      }
    };

    if (useSimulated) {
      return sendSos(18.5204, 73.8567, true);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => sendSos(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (window.confirm("GPS Blocked or Timeout. Would you like to transmit a simulated SHIELD Signal for demo purposes?")) {
          sendSos(18.5204, 73.8567, true);
        } else {
          setSosLoading(false);
          toast.error("Signal Transmission Aborted: No Location Data.");
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const navLinks = [
    { to: "/home", label: "Tourist Portal", icon: <MapIcon size={18} /> },
    { to: "/planner", label: "Planner", icon: <Calendar size={18} /> },
    { to: "/digital-id", label: "Digital ID", icon: <User size={18} /> },
    { to: "/wilderness", label: "Wilderness Mode", icon: <ShieldAlert size={18} />, color: "text-emerald-400" },
    { to: "/admin", label: "Control Center", icon: <AlertTriangle size={18} />, color: "text-indigo-400" },
  ];

  return (
    <nav className="sticky top-0 z-[60] bg-black/40 backdrop-blur-2xl border-b border-white/5" role="navigation" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/home" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1" aria-label="SHIELD AI Home">
            <span className="text-2xl font-black tracking-tighter text-white group-hover:text-indigo-400 transition-colors">
              SHIELD<span className="text-indigo-500">AI</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[8px] font-black uppercase text-indigo-400 tracking-widest animate-pulse">
              Boosted by AI
            </span>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden lg:flex gap-6 items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className={`text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md px-2 py-1 ${link.color || "text-white/60 hover:text-white"}`}
              >
                {link.label}
              </Link>
            ))}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={triggerSOS}
              disabled={sosLoading}
              aria-label="Trigger Emergency SOS"
              className="px-6 py-2 bg-red-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              {sosLoading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
              Emergency SOS
            </motion.button>
          </div>

          {/* Mobile SOS & Menu Toggle */}
          <div className="flex items-center gap-4 lg:hidden">
             <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={triggerSOS}
              disabled={sosLoading}
              aria-label="Trigger Emergency SOS"
              className="p-3 bg-red-600 rounded-full text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Shield size={20} className={sosLoading ? "animate-spin" : "animate-pulse"} />
            </motion.button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-white/80 hover:text-white focus:outline-none"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/95 backdrop-blur-3xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-bold ${link.color || "text-white/80 hover:bg-white/5 hover:text-white"}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function App() {
  const containerRef = useRef();
  
  return (
    <AppProvider>
      <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: '#050505', color: '#fff', border: '1px solid #333' } }} />
      <Router>
        <GsapGlitchWrapper containerRef={containerRef}>
          <div ref={containerRef} className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col">
          {/* Animated Background Gradients */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <Navbar />
          <SafetyAlert />
          
          <main className="relative flex-grow" role="main">
            <AnimatedRoutes />
          </main>

          <VoiceAssistant />
          
          <footer className="text-center py-10 text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold border-t border-white/5" role="contentinfo">
            &copy; 2026 SHIELD AI • National Tourist Safety Protocol
          </footer>
        </div>
        </GsapGlitchWrapper>
      </Router>
    </AppProvider>
  );
}

function GsapGlitchWrapper({ children, containerRef }) {
  const { alerts } = useApp();
  const glitching = useRef(false);
  
  useGSAP(() => {
    if (glitching.current) return;
    
    if (alerts.length > 0 && (alerts[0].type === 'SOS' || alerts[0].priority === 'CRITICAL')) {
      glitching.current = true;
      gsap.to(containerRef.current, {
        x: () => Math.random() * 20 - 10,
        y: () => Math.random() * 20 - 10,
        opacity: 0.8,
        filter: "contrast(200%) hue-rotate(90deg) saturate(300%)",
        duration: 0.05,
        yoyo: true,
        repeat: 10,
        onComplete: () => {
          gsap.set(containerRef.current, { clearProps: "all" });
          glitching.current = false;
        }
      });
    }
  }, [alerts]);

  return children;
}

export default App;

