import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Droplets, Thermometer, Wind, Zap, ArrowLeft, Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const FIRST_AID_DATA = [
  {
    id: 'snake-bite',
    title: 'Snake Bite',
    icon: <Zap className="text-yellow-400" />,
    steps: [
      "Keep the victim calm and still.",
      "Remove tight clothing or jewelry near the bite.",
      "Position the bite below heart level if possible.",
      "Clean the wound with water, but DO NOT flush it.",
      "Cover with a clean, dry dressing.",
      "DO NOT apply a tourniquet or ice.",
      "DO NOT try to suck out the venom."
    ],
    audio: "/assets/audio/snake_bite.mp3"
  },
  {
    id: 'hypothermia',
    title: 'Hypothermia',
    icon: <Thermometer className="text-blue-400" />,
    steps: [
      "Move the person out of the cold.",
      "Remove wet clothing.",
      "Cover with blankets or dry layers.",
      "Provide warm (not hot) non-alcoholic beverages.",
      "Monitor breathing and pulse.",
      "Avoid direct heat like hot water or heating lamps."
    ]
  },
  {
    id: 'fracture',
    title: 'Bone Fracture',
    icon: <Info className="text-emerald-400" />,
    steps: [
      "Stop any bleeding by applying pressure.",
      "Immobilize the injured area. Do not try to realign the bone.",
      "Apply ice packs to limit swelling (not directly on skin).",
      "Treat for shock if the person feels faint or has rapid breathing."
    ]
  },
  {
    id: 'heat-stroke',
    title: 'Heat Stroke',
    icon: <Thermometer className="text-orange-400" />,
    steps: [
      "Move the person to a cool, shaded area.",
      "Cool the person quickly using wet cloths, misting, or a fan.",
      "Apply ice packs to armpits, groin, neck, and back.",
      "Do not give fluids if the person is confused or unconscious."
    ]
  }
];

export default function WildernessAid() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-10">
          <Link to="/home" className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Wilderness First Aid</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Offline Emergency Guides</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIRST_AID_DATA.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(item)}
              className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-white/20 transition-all"
            >
              <div className="p-4 bg-white/5 rounded-xl text-2xl">
                {item.icon}
              </div>
              <div>
                <h3 className="font-black text-lg">{item.title}</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Tap for instructions</p>
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      {selected.icon}
                    </div>
                    <h2 className="text-3xl font-black">{selected.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelected(null)}
                    className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4 mb-10">
                  {selected.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-6 h-6 flex-shrink-0 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-medium text-white/80">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all">
                    <Play size={14} /> Play Audio Guide
                  </button>
                  <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">
                    Request Help
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
