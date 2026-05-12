# SHIELD AI: Smart Tourist Safety System (SIH 2026)

SHIELD AI is a comprehensive safety ecosystem designed for tourists in remote and wilderness areas. It features high-tech rescue tools, offline-first communication, and AI-driven navigation.

## 🌟 Survival Features (New)

### 1. Bluetooth Mesh SOS (Offline Mode)
- **Problem**: No signal in deep forests.
- **Solution**: Uses Web Bluetooth to broadcast SOS packets.
- **Demo**: Go to **Wilderness Mode**, disable internet (DevTools), and click "Enable Bluetooth SOS".

### 2. Last-Known Location (Low Battery)
- **Problem**: Rescue teams lose track when a phone dies.
- **Solution**: Automatically records and broadcasts a high-priority "Final Pulse" when battery < 15%.
- **Demo**: Simulated in `useSurvivalManager.js` hook.

### 3. Offline Wilderness First Aid
- **Problem**: No internet = no medical guidance.
- **Solution**: Pre-cached PWA module with step-by-step guides and audio assistance.
- **Demo**: Navigate to **Wilderness Mode** -> **First Aid Guide**. Works 100% offline.

### 4. Police Rescue Dashboard
- **Breadcrumb Trail**: View historical movement of any tourist.
- **Grid Search**: Generate tactical search grids (500m cells) to coordinate ground teams.
- **Trail Intel**: Automatic highlighting of local Pune forest trails.
- **Demo**: **Control Center** -> **Rescue Ops** tab.

### 5. AI Backtrack (Self-Rescue)
- **Solution**: High-accuracy breadcrumb recording to IndexedDB. A tactical 3D arrow guides users back to the last point where they had internet signal.
- **Demo**: **Wilderness Mode** -> **Backtrack to Safety**.

### 6. Offline Digital ID (Ed25519)
- **Solution**: Cryptographically signs tourist data. Authorities can verify ID authenticity offline using the "Verify Mode" without any database connection.
- **Demo**: **Digital ID** (Generate) -> **Verify ID** (Scan/Paste).

## 🛠️ Setup
1. `npm install` in both `frontend` and `backend`.
2. `npm run dev` to start the ecosystem.

## 🚀 Deployment
- Frontend: Vercel / PWA
- Backend: Render / DigitalOcean
- Database: Supabase
