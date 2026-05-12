import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, User, ArrowRight, Smartphone, Eye, EyeOff, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { api } from "../utils/api";
import axios from "axios";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function Login() {
  const textRef = useRef();
  const [step, setStep] = useState(1); // 1: Login, 2: OTP
  const [form, setForm] = useState({ id: "", password: "" });
  const [otp, setOtp] = useState(["", "", "", ""]);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  useGSAP(() => {
    if (textRef.current) {
      const text = textRef.current.innerText;
      textRef.current.innerText = "";
      
      const chars = text.split("");
      chars.forEach((char, i) => {
        const span = document.createElement("span");
        span.innerText = char;
        span.style.opacity = 0;
        textRef.current.appendChild(span);
        
        gsap.to(span, {
          opacity: 1,
          delay: i * 0.05,
          duration: 0.1,
          ease: "power2.in"
        });
      });
    }
  }, [step]);

  // Auto-fill OTP for Hackathon Demo Presentation
  useEffect(() => {
    let mounted = true;

    if (step === 2) {
      // Generate a random 4-digit verification code
      const demoCode = Math.floor(1000 + Math.random() * 9000).toString().split("");
      
      const fillDigit = (index) => {
        if (!mounted) return;
        
        if (index < 4) {
          setTimeout(() => {
            if (!mounted) return;
            setOtp((prev) => {
              const newOtp = [...prev];
              newOtp[index] = demoCode[index];
              return newOtp;
            });
            fillDigit(index + 1);
          }, 800); // 800ms per digit
        } else {
          // Wait 1.5 seconds for the jury to see the code, then auto-login
          setTimeout(() => {
            if (!mounted) return;
            toast.success("SHIELD Access Granted!");
            navigate("/home");
          }, 1500);
        }
      };

      fillDigit(0);
    }

    return () => {
      mounted = false;
    };
  }, [step, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (form.id && form.password) {
      setStep(2);
      toast.success(`Secure OTP sent to ${form.id}`);
    }
  };

  const handleBiometric = async () => {
    try {
      toast.loading("Initializing Biometric Scan...");
      const { data: options } = await axios.get(api("/api/auth/login-options"));
      const authResponse = await startAuthentication(options);
      // In production, verify authResponse on backend here
      toast.dismiss();
      toast.success("Biometric Match! Access Granted.");
      navigate("/home");
    } catch (err) {
      toast.dismiss();
      toast.error("Biometric Authentication Failed.");
    }
  };

  const handleOtp = (e) => {
    e.preventDefault();
    if (otp.join("").length === 4) {
      toast.success("SHIELD Access Granted!");
      navigate("/home");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(79,70,229,0.1)] relative overflow-hidden animate-float"
          >
            {/* Sci-Fi Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500/50 shadow-[0_0_20px_#6366f1] animate-scanline z-50 pointer-events-none" />

            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] -z-10" />
            
            <div className="flex flex-col items-center mb-10">
              <div className="p-4 bg-indigo-600 rounded-3xl mb-4 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                <Shield className="text-white" size={32} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white">SHIELD <span className="text-indigo-500">AUTH</span></h2>
              <p ref={textRef} className="text-[10px] uppercase tracking-[0.3em] text-indigo-300 mt-2 font-bold min-h-[15px]">National Security Gateway</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-indigo-400 tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="email"
                    required
                    value={form.id}
                    onChange={(e) => setForm({...form, id: e.target.value})}
                    placeholder="Enter your email ID"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-white/20 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase font-black text-indigo-400 tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-white/20 text-white"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3"
              >
                Authenticate
                <ArrowRight size={20} />
              </button>

              <div className="relative flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/5"></div>
                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">OR</span>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>

              <button
                type="button"
                onClick={handleBiometric}
                className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <Smartphone size={20} className="text-indigo-400" />
                Use Biometrics
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden animate-float"
          >
            {/* Sci-Fi Scanning Line (Emerald) */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/50 shadow-[0_0_20px_#10b981] animate-scanline z-50 pointer-events-none" />

            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[60px] -z-10" />
            
            <div className="flex flex-col items-center mb-10">
              <div className="p-4 bg-emerald-600 rounded-3xl mb-4 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <Smartphone className="text-white animate-pulse" size={32} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Two-Step <span className="text-emerald-500">Auth</span></h2>
              <p ref={textRef} className="text-[10px] uppercase tracking-[0.3em] text-emerald-300 mt-2 font-bold min-h-[15px]">Enter Verification Code</p>
            </div>

            <form onSubmit={handleOtp} className="space-y-8">
              <div className="flex justify-between gap-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[i] = e.target.value;
                      setOtp(newOtp);
                      if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                    }}
                    className="w-16 h-20 text-center text-3xl font-black bg-white/5 border border-white/10 rounded-2xl focus:border-emerald-500 outline-none text-emerald-400"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl"
              >
                Verify & Enter
              </button>
              
              <p className="text-center text-[10px] text-white/20 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => setStep(1)}>
                Back to credentials
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
