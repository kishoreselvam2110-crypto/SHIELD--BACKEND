export const api = (path) => {
  // Use window.location.origin to automatically adapt to local IP or domain
  const base = import.meta.env.VITE_BACKEND_URL || window.location.origin;
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
};
