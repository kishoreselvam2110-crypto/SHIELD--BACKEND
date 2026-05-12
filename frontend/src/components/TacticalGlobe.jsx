import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Html } from '@react-three/drei';
import * as THREE from 'three';

function Globe({ activeLocations = [] }) {
  const meshRef = useRef();
  
  // Create random points on the sphere for "Satellites"
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i < 50; i++) {
      const phi = Math.acos(-1 + (2 * i) / 50);
      const theta = Math.sqrt(50 * Math.PI) * phi;
      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(phi);
      p.push(new THREE.Vector3(x, y, z).multiplyScalar(1.2));
    }
    return p;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y = time * 0.1;
    meshRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
  });

  return (
    <group ref={meshRef}>
      {/* Core Globe */}
      <Sphere args={[1, 32, 32]}>
        <meshPhongMaterial 
          color="#4f46e5" 
          emissive="#1e1b4b" 
          wireframe 
          transparent 
          opacity={0.3} 
        />
      </Sphere>

      {/* Distortion Layer for Atmosphere */}
      <Sphere args={[1.05, 32, 32]}>
        <MeshDistortMaterial
          color="#6366f1"
          speed={2}
          distort={0.2}
          transparent
          opacity={0.1}
        />
      </Sphere>

      {/* Satellite Points */}
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#818cf8" />
        </mesh>
      ))}
      
      {/* Live Tourist Tracking Beacons */}
      {activeLocations.map((loc, i) => {
        const latRad = loc.lat * (Math.PI / 180);
        const lonRad = -loc.lon * (Math.PI / 180);
        const r = 1.02; // slightly above globe surface
        const x = r * Math.cos(latRad) * Math.cos(lonRad);
        const y = r * Math.sin(latRad);
        const z = r * Math.cos(latRad) * Math.sin(lonRad);
        
        return (
          <mesh key={`tourist-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
            {/* Beacon Pulse Ring */}
            <mesh>
              <ringGeometry args={[0.05, 0.08, 32]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          </mesh>
        );
      })}
      
      {/* High-Tech Orbital Rings */}
      <group ref={(g) => { if(g) g.rotation.x += 0.005 }}>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.5, 0.005, 8, 40]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
        </mesh>
      </group>
      <group ref={(g) => { if(g) g.rotation.y += 0.003 }}>
        <mesh rotation={[0, Math.PI / 3, 0]}>
          <torusGeometry args={[1.7, 0.002, 8, 40]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export default function TacticalGlobe({ activeLocations = [] }) {
  return (
    <div className="w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4f46e5" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#818cf8" />
        
        <Suspense fallback={<Html center><div className="text-indigo-500 animate-pulse font-black uppercase tracking-widest text-[10px]">Loading Satellite Matrix...</div></Html>}>
          <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Globe activeLocations={activeLocations} />
          </Float>
        </Suspense>
        
        <OrbitControls 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
