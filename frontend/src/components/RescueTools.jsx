import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Grid, Info, Download, Trash2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Rectangle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Sample Trail Data (Pune Forest Area for Demo)
const SAMPLE_TRAILS = [
  { id: 1, name: "Vetal Tekdi Main Trail", points: [[18.5255, 73.8235], [18.5285, 73.8215], [18.5305, 73.8185]] },
  { id: 2, name: "Pashan Lake Perimeter", points: [[18.5350, 73.7850], [18.5380, 73.7880], [18.5410, 73.7840]] }
];

export default function RescueTools({ selectedTourist, trailHistory = [] }) {
  const [activeTool, setActiveTool] = useState('breadcrumb'); // 'breadcrumb', 'grid', 'trails'
  const [gridCells, setGridCells] = useState([]);
  const [showTrails, setShowTrails] = useState(true);

  const generateGrid = () => {
    // Generate a 5x5 grid around the selected tourist or center
    const center = selectedTourist ? [selectedTourist.lat, selectedTourist.lon] : [18.5204, 73.8567];
    const cells = [];
    const step = 0.005; // ~500m
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const bounds = [
          [center[0] + i * step, center[1] + j * step],
          [center[0] + (i + 1) * step, center[1] + (j + 1) * step]
        ];
        cells.push({ id: `${i}-${j}`, bounds, searched: false });
      }
    }
    setGridCells(cells);
    toast.success("Rescue Grid Generated (500m Cells)");
  };

  const exportSearchPlan = async () => {
    const element = document.getElementById('rescue-map-container');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.text("SHIELD AI: MISSION RESCUE PLAN", 10, 10);
    pdf.text(`Target: ${selectedTourist?.name || 'Unknown'}`, 10, 20);
    pdf.addImage(imgData, 'PNG', 10, 30, 280, 150);
    pdf.save("rescue-plan.pdf");
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex gap-2">
          <ToolBtn active={activeTool === 'breadcrumb'} onClick={() => setActiveTool('breadcrumb')} icon={<MapPin size={14} />} label="Breadcrumbs" />
          <ToolBtn active={activeTool === 'grid'} onClick={() => setActiveTool('grid')} icon={<Grid size={14} />} label="Search Grid" />
          <ToolBtn active={activeTool === 'trails'} onClick={() => setActiveTool('trails')} icon={<Info size={14} />} label="Trail Intelligence" />
        </div>
        <button 
          onClick={exportSearchPlan}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all"
        >
          <Download size={14} /> Export Plan
        </button>
      </div>

      <div id="rescue-map-container" className="flex-1 bg-black rounded-[3rem] overflow-hidden border border-white/10 relative">
        <MapContainer center={[18.5204, 73.8567]} zoom={13} className="w-full h-full grayscale invert opacity-80 contrast-[1.2]">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Feature 4a: Breadcrumb Trail */}
          {activeTool === 'breadcrumb' && trailHistory.length > 0 && (
            <Polyline positions={trailHistory.map(p => [p.lat, p.lon])} color="#6366f1" weight={4} dashArray="10, 10" />
          )}

          {/* Feature 4b: Grid Search Tool */}
          {activeTool === 'grid' && gridCells.map(cell => (
            <Rectangle 
              key={cell.id} 
              bounds={cell.bounds} 
              pathOptions={{ 
                color: '#ef4444', 
                fillColor: cell.searched ? '#10b981' : '#ef4444', 
                fillOpacity: 0.1 
              }} 
              eventHandlers={{ click: () => {
                setGridCells(prev => prev.map(c => c.id === cell.id ? { ...c, searched: !c.searched } : c));
              }}}
            />
          ))}

          {/* Feature 4c: Trail Intelligence */}
          {showTrails && SAMPLE_TRAILS.map(trail => (
            <Polyline key={trail.id} positions={trail.points} color="#10b981" weight={6} opacity={0.5}>
              <Popup>{trail.name}</Popup>
            </Polyline>
          ))}
        </MapContainer>

        {activeTool === 'grid' && (
          <div className="absolute top-6 right-6 z-[1000]">
             <button onClick={generateGrid} className="px-6 py-3 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl">
                Re-Generate Grid
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'
      }`}
    >
      {icon} {label}
    </button>
  );
}
