import React, { useEffect } from 'react';
import { useMap, GeoJSON } from 'react-leaflet';
import riskZones from '../data/riskZones.json';

export default function RiskMapOverlay() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    console.log("RiskMapOverlay: Mapping active safety perimeters...");
  }, [map]);

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 10px;">
          <h4 style="margin: 0; font-weight: 900; text-transform: uppercase; font-size: 10px; color: #6366f1;">Risk Zone</h4>
          <p style="margin: 5px 0; font-weight: 700; font-size: 14px;">${feature.properties.name}</p>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 8px; h-8px; border-radius: 50%; background: ${feature.properties.color};"></div>
            <span style="font-size: 10px; font-weight: 800; color: ${feature.properties.color};">Risk Level: ${feature.properties.riskLevel}%</span>
          </div>
        </div>
      `);
    }
  };

  const style = (feature) => {
    return {
      fillColor: feature.properties.color,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.3
    };
  };

  return (
    <GeoJSON 
      data={riskZones} 
      style={style} 
      onEachFeature={onEachFeature} 
    />
  );
}
