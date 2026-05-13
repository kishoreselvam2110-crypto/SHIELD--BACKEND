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
    const center = selectedTourist ? [selectedTourist.lat, selectedTourist.lon] : [18.5204, 73.8567];
    const cells = [];
    const step = 0.005; 
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
    <div className="flex flex-col h-full gap-4 md:gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 p-4 md:p-6 rounded-[2rem] md:rounded-3xl border border-white/10 gap-4">
        <div className="flex flex-wrap gap-2">
          <ToolBtn active={activeTool === 'breadcrumb'} onClick={() => setActiveTool('breadcrumb')} icon={<MapPin size={14} />} label="Breadcrumbs" />
          <ToolBtn active={activeTool === 'grid'} onClick={() => setActiveTool('grid')} icon={<Grid size={14} />} label="Search Grid" />
          <ToolBtn active={activeTool === 'trails'} onClick={() => setActiveTool('trails')} icon={<Info size={14} />} label="Trails" />
        </div>
        <button 
          onClick={exportSearchPlan}
          aria-label="Export Rescue Plan as PDF"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
        >
          <Download size={14} /> Export Plan
        </button>
      </div>

      <div id="rescue-map-container" className="flex-1 min-h-[300px] bg-black rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/10 relative">
        <MapContainer center={[18.5204, 73.8567]} zoom={13} className="w-full h-full grayscale invert opacity-80 contrast-[1.2]" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {activeTool === 'breadcrumb' && trailHistory.length > 0 && (
            <Polyline positions={trailHistory.map(p => [p.lat, p.lon])} color="#6366f1" weight={4} dashArray="10, 10" />
          )}

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

          {showTrails && SAMPLE_TRAILS.map(trail => (
            <Polyline key={trail.id} positions={trail.points} color="#10b981" weight={6} opacity={0.5}>
              <Popup>{trail.name}</Popup>
            </Polyline>
          ))}
        </MapContainer>

        {activeTool === 'grid' && (
          <div className="absolute top-4 right-4 z-[1000]">
             <button 
              onClick={generateGrid} 
              aria-label="Re-Generate Rescue Grid"
              className="px-6 py-3 bg-white text-black rounded-full font-black uppercase tracking-widest text-[9px] shadow-2xl hover:bg-white/90 transition-all"
             >
                Regen Grid
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
      aria-pressed={active}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${
        active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'
      }`}
    >
      {icon} {label}
    </button>
  );
}
