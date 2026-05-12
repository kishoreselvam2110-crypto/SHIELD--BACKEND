import './otel.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { z } from 'zod';

// AI & Services
import { getTripPlan } from './ai.js';
import { getPlaces } from './osm.js';
import { supabase } from './supabase.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
    },
  },
});

// Register Plugins
fastify.register(cors, { origin: '*' });

// Local Persistence Fallback
const STORE_PATH = path.join(__dirname, 'data_store.json');
let touristIdStore = {};
try {
  if (fs.existsSync(STORE_PATH)) {
    touristIdStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  }
} catch (e) { console.error("Store load failed"); }

const saveStore = () => fs.writeFileSync(STORE_PATH, JSON.stringify(touristIdStore, null, 2));

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 0
});

redis.on('error', (err) => {
  console.warn("⚠️ Redis (DragonflyDB) not connected. Falling back to in-memory caching.");
});

// In-Memory Safety Data (Fallback)
let touristLocations = {};
let alerts = [];

const getCachedTrip = async (key) => {
  if (redis.status !== 'ready') return null;
  const cached = await redis.get(`trip:${key}`);
  return cached ? JSON.parse(cached) : null;
};

const setCachedTrip = async (key, data) => {
  if (redis.status !== 'ready') return;
  await redis.set(`trip:${key}`, JSON.stringify(data), 'EX', 86400); // 24h cache
};

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const rpName = 'SHIELD AI Security';
const rpID = 'localhost';
const origin = `http://${rpID}:5173`;

let userAuthenticators = {}; // In-memory for demo, should be DB

// WebAuthn Endpoints
fastify.get('/api/auth/register-options', async () => {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: 'admin-1',
    userName: 'admin@shield.ai',
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
  return options;
});

fastify.post('/api/auth/verify-registration', async (request) => {
  const { body } = request;
  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: body.challenge, // In production, retrieve from session
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified) {
    userAuthenticators['admin-1'] = verification.registrationInfo;
    return { success: true };
  }
  throw new Error('Registration failed');
});

fastify.get('/api/auth/login-options', async () => {
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: Object.values(userAuthenticators).map(auth => ({
      id: auth.credentialID,
      type: 'public-key',
    })),
  });
  return options;
});

fastify.get('/api/places', async (request, reply) => {
  const { city } = request.query;
  const data = await getPlaces(city);
  return data.map(p => ({
    name: p.name,
    address: p.display_name,
    lat: p.lat,
    lon: p.lon,
    type: p.type
  }));
});

// Trip Schema Validation
const TripSchema = z.object({
  destination: z.string(),
  days: z.number().min(1).max(30),
  budget: z.string(),
  language: z.string().optional()
});

fastify.post('/api/smart-trip', async (request, reply) => {
  const { destination, days, budget, language } = TripSchema.parse(request.body);
  const cacheKey = `${destination}-${days}-${budget}-${language}`;
  
  const cached = await getCachedTrip(cacheKey);
  if (cached) return { success: true, ...cached };

  // Check Supabase Persistent Cache
  if (supabase) {
    const { data: dbTrip } = await supabase
      .from('itineraries')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();
    
    if (dbTrip) {
      await setCachedTrip(cacheKey, dbTrip.data);
      return { success: true, ...dbTrip.data };
    }
  }

  let trip = await getTripPlan(destination, days, budget, language);
  
  if (!trip || !trip.itinerary || trip.itinerary.length < days) {
    const places = await getPlaces(destination);
    trip = {
      destination,
      summary: `Dynamic tactical plan for ${destination} based on OpenStreetMap real-time tourist data.`,
      itinerary: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        theme: "Regional Tactical Exploration",
        activities: places.slice(i * 3, (i + 1) * 3).map(p => ({
          name: p.name || p.display_name.split(',')[0],
          lat: p.lat,
          lon: p.lon,
          description: p.display_name,
          time: `${9 + i}:00 AM`
        }))
      }))
    };
  }
  await setCachedTrip(cacheKey, trip);
  if (supabase) {
    await supabase.from('itineraries').insert([{ cache_key: cacheKey, data: trip }]);
  }

  return { success: true, ...trip };
});

// Initialize Server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    
    // Bind Socket.io
    const io = new Server(fastify.server, { cors: { origin: "*" } });
    
    io.on('connection', (socket) => {
      console.log('Signal Linked:', socket.id);
      
      socket.on('track-location', (data) => {
        touristLocations[data.userId] = { lat: data.lat, lon: data.lon, lastSeen: new Date() };
        io.emit('location-update', touristLocations);
      });

      socket.on('disconnect', () => console.log('Signal Lost:', socket.id));
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
