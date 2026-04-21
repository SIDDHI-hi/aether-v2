import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const COLORS: any = {
  default: '#6b7280',
  wire: '#9ca3af',
  added: '#10b981',
  removed: '#ef4444',
  modified: '#f59e0b',
  unchanged: '#4b5563',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  pulse: '#00f0ff',
};

const SCALE = 0.05;

// Notice we use 'any' here so TS doesn't yell about missing mock data properties
const Connector3D = ({ item, color, isPulsing }: { item: any, color: string, isPulsing: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (isPulsing && meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={[item.x * SCALE - 20, -(item.y * SCALE - 10), 0]}>
      <Box ref={meshRef} args={[item.width * SCALE, item.height * SCALE, 2]}>
        <meshStandardMaterial color={color} emissive={isPulsing ? color : '#000000'} emissiveIntensity={isPulsing ? 1 : 0} />
      </Box>
      <Text position={[0, item.height * SCALE / 2 + 0.5, 0]} fontSize={0.8} color="white">
        {item.label}
      </Text>
    </group>
  );
};

const Wire3D = ({ source, target, color, isPulsing }: { source: any, target: any, color: string, isPulsing: boolean }) => {
  const start = new THREE.Vector3(source.x * SCALE - 20, -(source.y * SCALE - 10), 0);
  const end = new THREE.Vector3(target.x * SCALE - 20, -(target.y * SCALE - 10), 0);
  
  const distance = start.distanceTo(end);
  const midpoint = start.clone().lerp(end, 0.5);
  
  const direction = end.clone().sub(start).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  return (
    <group position={midpoint} rotation={euler}>
      <Cylinder args={[0.2, 0.2, distance, 8]}>
        <meshStandardMaterial color={color} emissive={isPulsing ? color : '#000000'} emissiveIntensity={isPulsing ? 1 : 0} />
      </Cylinder>
    </group>
  );
};

export const Twin3D: React.FC = () => {
  const { data, compareMode, faultMode, pulsingIds } = useStore();

  // 1. FAILSAFE: If there is no data at all, render a placeholder
  if (!data) {
    return (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center font-mono text-neon-amber">
        <p>Awaiting valid Neural Netlist...</p>
      </div>
    );
  }

  // 2. DATA NORMALIZATION: Handle both Mock Data and live Gemini Data
  // Gemini outputs `nodes`, Mock outputs `connectors`
  const rawNodes = data.connectors || data.nodes || [];
  const rawWires = data.wires || data.connections || [];

  // 3. FALLBACK COORDINATES: If Gemini didn't provide X/Y, arrange them in a circle!
  const safeNodes = useMemo(() => {
    const total = rawNodes.length;
    return rawNodes.map((n: any, i: number) => {
      // If it already has x/y (mock data), use it. Otherwise, calculate circle.
      const radius = 300;
      const angle = (i / total) * Math.PI * 2;
      return {
        ...n,
        x: n.x !== undefined ? n.x : Math.cos(angle) * radius + 400,
        y: n.y !== undefined ? n.y : Math.sin(angle) * radius + 300,
        width: n.width || 60,
        height: n.height || 40,
        id: n.id || `node_${i}`
      };
    });
  }, [rawNodes]);

  const getColor = (id: string, type: 'connector' | 'wire') => {
    if (pulsingIds.includes(id)) return COLORS.pulse;
    if (compareMode) {
      // Optional chaining added to prevent crashes if diff_state is missing
      const state = data?.diff_state?.[id];
      return COLORS[state as keyof typeof COLORS] || COLORS.default;
    }
    if (faultMode) {
      // Optional chaining added to prevent crashes if risk_score is missing
      const state = data?.risk_score?.[id];
      return COLORS[state as keyof typeof COLORS] || COLORS.default;
    }
    return type === 'wire' ? COLORS.wire : '#171717';
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a]">
      <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        {/* Draw Wires */}
        {rawWires.map((wire: any, index: number) => {
          // Check for both 'source' and 'target' matching the node IDs
          const source = safeNodes.find((c: any) => c.id === wire.source);
          const target = safeNodes.find((c: any) => c.id === wire.target);
          
          if (!source || !target) return null;
          
          return (
            <Wire3D 
              key={wire.id || `wire_${index}`}
              source={source} 
              target={target} 
              color={getColor(wire.id, 'wire')}
              isPulsing={pulsingIds.includes(wire.id)}
            />
          );
        })}

        {/* Draw Connectors */}
        {safeNodes.map((c: any) => (
          <Connector3D 
            key={c.id} 
            item={c} 
            color={getColor(c.id, 'connector')}
            isPulsing={pulsingIds.includes(c.id)}
          />
        ))}
        
        <gridHelper args={[100, 100, '#1f2937', '#111827']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]} />
      </Canvas>
    </div>
  );
};