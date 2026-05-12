import { openDB } from 'idb';

const DB_NAME = 'shield-survival-db';
const STORE_NAME = 'offline-data';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('location-history')) {
        db.createObjectStore('location-history', { keyPath: 'timestamp' });
      }
    },
  });
};

export const saveOfflineData = async (type, data) => {
  const db = await initDB();
  return db.add(STORE_NAME, { type, data, timestamp: Date.now(), synced: false });
};

export const getUnsyncedData = async () => {
  const db = await initDB();
  const all = await db.getAll(STORE_NAME);
  return all.filter(item => !item.synced);
};

export const markSynced = async (id) => {
  const db = await initDB();
  const item = await db.get(STORE_NAME, id);
  if (item) {
    item.synced = true;
    await db.put(STORE_NAME, item);
  }
};

export const saveLocationPoint = async (point) => {
  const db = await initDB();
  return db.put('location-history', { ...point, timestamp: Date.now() });
};

export const getLocationHistory = async (limit = 1000) => {
  const db = await initDB();
  const all = await db.getAll('location-history');
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
};
