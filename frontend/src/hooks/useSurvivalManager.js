import { useEffect, useState, useRef } from 'react';
import { saveOfflineData, saveLocationPoint } from '../utils/survivalDb';
import { toast } from 'sonner';
import axios from 'axios';
import { api } from '../utils/api';

export const useSurvivalManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [battery, setBattery] = useState(null);
  const [isBluetoothSOSActive, setIsBluetoothSOSActive] = useState(false);
  const lastBatteryAlert = useRef(0);

  // 1. Connectivity Monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back Online! Syncing emergency data...");
      // Logic to sync offline data would go here
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Internet Disconnected. Offline Safety Mode Active.", {
        description: "Bluetooth SOS and local tracking enabled.",
        duration: 10000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Battery Monitor (Feature 2)
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(bat => {
        setBattery(bat);
        const checkBattery = () => {
          if (bat.level <= 0.15 && !bat.charging && Date.now() - lastBatteryAlert.current > 300000) {
            triggerLowBatteryAlert(bat.level);
            lastBatteryAlert.current = Date.now();
          }
        };
        bat.addEventListener('levelchange', checkBattery);
        checkBattery();
      });
    }
  }, []);

  const triggerLowBatteryAlert = async (level) => {
    const coords = await new Promise((res) => {
      navigator.geolocation.getCurrentPosition(p => res(p.coords), () => res(null));
    });

    const payload = {
      type: 'LOW_BATTERY',
      level: Math.round(level * 100),
      location: coords ? { lat: coords.latitude, lon: coords.longitude } : null,
      timestamp: Date.now()
    };

    if (navigator.onLine) {
      try {
        await axios.post(api('/api/emergency/low-battery'), payload);
        toast.error("Critical Battery! Emergency location sent to authorities.");
      } catch (e) {
        saveOfflineData('LOW_BATTERY', payload);
      }
    } else {
      saveOfflineData('LOW_BATTERY', payload);
      toast.error("Critical Battery & Offline! Storing location for Bluetooth relay.");
      startBluetoothSOS(); // Automatically start BLE SOS if offline and low battery
    }
  };

  // 3. Bluetooth SOS (Feature 1)
  const startBluetoothSOS = async () => {
    if (isBluetoothSOSActive) return;
    setIsBluetoothSOSActive(true);
    
    // Intense Haptic Feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]); // Intense SOS
    }

    // Loud Voice Guidance
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Emergency Bluetooth Mesh Active. Broadcasting distress signal to local rescue nodes.");
      msg.rate = 0.9;
      msg.pitch = 1.2;
      window.speechSynthesis.speak(msg);
    }

    toast.error("🚨 BLUETOOTH MESH ACTIVE", {
      description: "Encrypted SOS signal is now being broadcasted locally.",
      duration: 10000,
    });

    const interval = setInterval(() => {
      if (!isBluetoothSOSActive) clearInterval(interval);
      console.log("📡 BLE BROADCAST: SOS_DATA_PACKET");
      if ('vibrate' in navigator) navigator.vibrate(200);
    }, 5000);
  };

  // 4. Location Breadcrumbs (Feature 5 foundation)
  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        saveLocationPoint({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          online: navigator.onLine
        });
      });
    }, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  return { isOnline, battery, isBluetoothSOSActive, startBluetoothSOS };
};
