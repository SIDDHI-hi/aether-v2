import { useRef, useState, useMemo, type FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

const ComplexWiringHarness: FC = () => {
  const mainTrunk = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, 4.0), 
    new THREE.Vector3(0, 0.5, 0),   
    new THREE.Vector3(0, 0.6, -3.5) 
  ]), []);

  const networks = useMemo(() => {
    const paths: { curve: THREE.CatmullRomCurve3; color: string }[] = [];
    for (let i = 0; i < 6; i++) {
      paths.push({
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.5, 3.5 - i * 1.2),
          new THREE.Vector3((Math.random() > 0.5 ? 1 : -1) * 1.6, Math.random() * 0.4 + 0.3, 3.5 - i * 1.2),
          new THREE.Vector3((Math.random() > 0.5 ? 1.9 : -1.9), Math.random() * 0.3 + 0.2, 3.5 - i * 1.2 - 0.5),
        ]),
        color: "#ff003c"
      });
    }
    paths.push({ curve: new THREE.CatmullRomCurve3([new THREE.Vector3(0.1, 0.5, 2.5), new THREE.Vector3(0.1, 0.5, -2.0)]), color: "#39ff14" });
    paths.push({ curve: new THREE.CatmullRomCurve3([new THREE.Vector3(-0.1, 0.5, 2.5), new THREE.Vector3(-0.1, 0.5, -2.0)]), color: "#39ff14" });
    for (let i = 0; i < 15; i++) {
      paths.push({
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.0, (Math.random() - 0.5) * 5),
          new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 1.0, (Math.random() - 0.5) * 5),
          new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.0, (Math.random() - 0.5) * 5)
        ]),
        color: Math.random() > 0.6 ? "#ff003c" : "#39ff14"
      });
    }
    return paths;
  }, []);

  return (
    <group>
      <Line points={mainTrunk.getPoints(60)} color="#00f0ff" lineWidth={5} transparent opacity={0.9} />
      {networks.map((net, i) => (
        <Line key={i} points={net.curve.getPoints(30)} color={net.color} lineWidth={1} transparent opacity={0.5} />
      ))}
    </group>
  );
};

const CyberCarWireframe: FC = () => {
  const profileCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.2, 4.3), new THREE.Vector3(0, 0.6, 2.5), 
    new THREE.Vector3(0, 0.8, 1.3), new THREE.Vector3(0, 1.4, -0.3), 
    new THREE.Vector3(0, 1.2, -2.1), new THREE.Vector3(0, 0.3, -4.1),
  ]), []);
  const width = 1.9;

  return (
    <group>
      <Line points={profileCurve.getPoints(60).map(p => new THREE.Vector3(width, p.y, p.z))} color="#00f0ff" lineWidth={3} transparent opacity={0.5} />
      <Line points={profileCurve.getPoints(60).map(p => new THREE.Vector3(-width, p.y, p.z))} color="#00f0ff" lineWidth={3} transparent opacity={0.5} />
      {[width, -width].map((w, i) => (
        <group key={i}>
            <mesh position={[w, 0.4, 2.6]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.06, 16, 32]} /><meshBasicMaterial color="#00f0ff" /></mesh>
            <mesh position={[w, 0.4, -2.4]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.4, 0.06, 16, 32]} /><meshBasicMaterial color="#0057ff" /></mesh>
        </group>
      ))}
    </group>
  );
};

const SceneContainer: FC<{ isTransitioning: boolean }> = ({ isTransitioning }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_state, delta) => {
    if (groupRef.current && isTransitioning) {
      groupRef.current.rotation.y += delta * 4;
      groupRef.current.position.z += delta * 12;
      groupRef.current.scale.lerp(new THREE.Vector3(3.5, 3.5, 3.5), delta * 3);
    }
  });

  return (
    <group ref={groupRef}>
      {/* FIXED PLATFORM: Using a simple glowing ring instead of a thick dabba */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[8.8, 9, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} />
      </mesh>
      <CyberCarWireframe />
      <ComplexWiringHarness />
    </group>
  );
};

export const SplashScreen: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(20px)" }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden font-mono"
    >
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [9, 6, 11], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <spotLight position={[0, 10, 0]} intensity={2.5} color="#00f0ff" />
          <SceneContainer isTransitioning={isTransitioning} />
          <OrbitControls autoRotate={!isTransitioning} autoRotateSpeed={0.5} enableZoom={true} enablePan={false} />
          <Grid infiniteGrid fadeDistance={60} cellColor="#1a1a1a" sectionColor="#080808" position={[0, -0.2, 0]} />
          <EffectComposer><Bloom intensity={2.2} mipmapBlur /></EffectComposer>
        </Canvas>
      </div>

      <div className="absolute top-16 z-10 w-full px-4 flex flex-col items-center pointer-events-none select-none text-center">
        <h1 className="text-white text-3xl md:text-5xl lg:text-6xl tracking-[0.3em] uppercase leading-tight">
          WIRE HARNESS INTELLIGENCE
        </h1>
        <h2 className="mt-4 text-[10px] md:text-xs text-[#00f0ff]/70 tracking-[0.5em] uppercase">
          AI-Powered Digital Twin Digitization
        </h2>
      </div>

      {!isTransitioning && (
        <button 
          onClick={() => { setIsTransitioning(true); setTimeout(onComplete, 1200); }}
          className="absolute bottom-16 z-10 px-10 py-5 bg-[#0a0a0a]/80 border border-[#00f0ff]/30 text-white text-sm tracking-[0.3em] uppercase hover:shadow-[0_0_40px_rgba(0,240,255,0.4)] transition-all"
        >
          [ Initialize System ]
        </button>
      )}
    </motion.div>
  );
};