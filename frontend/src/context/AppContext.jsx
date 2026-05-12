import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [tourists, setTourists] = useState({});
  const [itinerary, setItinerary] = useState(null);

  // Memoized Socket Instance - dynamically adapts to current origin for mobile/LAN access
  const socket = useMemo(() => io(import.meta.env.VITE_BACKEND_URL || window.location.origin, {
    transports: ["websocket"],
    reconnectionAttempts: 5
  }), []);

  useEffect(() => {
    socket.on("connect", () => console.log("Socket Connected"));

    socket.on("new-alert", (a) => {
      setAlerts((prev) => [a, ...prev].slice(0, 30));
      
      // Global Toast Notification
      if (a.type === 'SOS') {
        toast.error(`🚨 SOS ALERT: ${a.message || 'Emergency Request'}`, { duration: 6000 });
      } else {
        toast(a.alert || 'Safety Notification', { icon: '⚠️', duration: 5000 });
      }
    });

    socket.on("location-update", ({ userId, lat, lon }) => {
      setTourists((t) => ({ ...t, [userId]: { lat, lon } }));
    });

    // Cleanup
    return () => {
      socket.off("new-alert");
      socket.off("location-update");
      socket.off("connect");
      socket.disconnect();
    };
  }, [socket]);

  const value = {
    user,
    setUser,
    alerts,
    setAlerts,
    tourists,
    setTourists,
    itinerary,
    setItinerary,
    socket,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
