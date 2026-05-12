import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Battery, AlertTriangle, CheckCircle } from 'lucide-react';
import * as turf from '@turf/turf';
import riskZones from '../data/riskZones.json';

export default function SafetyScore({ lat, lon, batteryLevel = 100, tripStatus = 'idle' }) {
  const score = useMemo(() => {
    let baseScore = 100;

    // 1. GPS Location Risk (GeoJSON check)
    if (lat && lon) {
      const point = turf.point([lon, lat]);
      let maxRisk = 0;
      
      riskZones.features.forEach(feature => {
        if (turf.booleanPointInPolygon(point, feature)) {
          maxRisk = Math.max(maxRisk, feature.properties.riskLevel);
        }
      });
      
      baseScore -= maxRisk;
    }

    // 2. Battery Level Impact
    if (batteryLevel < 20) baseScore -= 15;
    else if (batteryLevel < 50) baseScore -= 5;

    // 3. Trip Status Impact
    if (tripStatus === 'panic') baseScore = 0;
    else if (tripStatus === 'active') baseScore -= 5; // Higher vigilance needed

    return Math.max(0, Math.min(100, baseScore));
  }, [lat, lon, batteryLevel, tripStatus]);

  const getColor = (s) => {
    if (s > 75) return 'text-emerald-400';
    if (s > 40) return 'text-amber-400';
    return 'text-red-500';
  };

  const getLabel = (s) => {
    if (s > 75) return 'Optimal Safety';
    if (s > 40) return 'Vigilance Advised';
    return 'Critical Risk';
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/10"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (251.2 * score) / 100}
            strokeLinecap="round"
            className={`${getColor(score)} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-black ${getColor(score)}`}>{score}</span>
        </div>
      </div>

      <div className="text-center z-10">
        <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-1">Safety Index</p>
        <p className={`text-xs font-bold uppercase tracking-tighter ${getColor(score)}`}>{getLabel(score)}</p>
      </div>

      <div className="flex gap-4 mt-2 z-10">
        <div className="flex items-center gap-1 opacity-40">
          <Battery size={12} />
          <span className="text-[10px] font-bold">{batteryLevel}%</span>
        </div>
        <div className="flex items-center gap-1 opacity-40">
          {tripStatus === 'idle' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
          <span className="text-[10px] font-bold uppercase">{tripStatus}</span>
        </div>
      </div>
    </motion.div>
  );
}
