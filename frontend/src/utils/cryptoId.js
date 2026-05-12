import * as ed from '@stablelib/ed25519';
import { openDB } from 'idb';

const DB_NAME = 'shield-id-keys';

export const getKeys = async () => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('keys');
    }
  });

  let keys = await db.get('keys', 'my-id-key');
  if (!keys) {
    keys = ed.generateKeyPair();
    await db.put('keys', keys, 'my-id-key');
  }
  return keys;
};

export const signProfile = async (profileData) => {
  const keys = await getKeys();
  const message = new TextEncoder().encode(JSON.stringify(profileData));
  const signature = ed.sign(keys.secretKey, message);
  return {
    ...profileData,
    signature: btoa(String.fromCharCode.apply(null, signature)),
    publicKey: btoa(String.fromCharCode.apply(null, keys.publicKey))
  };
};

export const verifyProfile = (signedData) => {
  const { signature, publicKey, ...data } = signedData;
  const message = new TextEncoder().encode(JSON.stringify(data));
  const sigUint8 = new Uint8Array(atob(signature).split('').map(c => c.charCodeAt(0)));
  const pubUint8 = new Uint8Array(atob(publicKey).split('').map(c => c.charCodeAt(0)));
  return ed.verify(pubUint8, message, sigUint8);
};
