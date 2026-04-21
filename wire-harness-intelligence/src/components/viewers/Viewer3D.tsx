import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, TransformControls, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
 
const THEME = {
  bg: '#F8F9FA',
  edge: '#CBD5E1',
  text: '#334155',
  accent: '#0284C7',
};
 
const SCALE = 0.05;
 
// ─── Component type detection ─────────────────────────────────────────────────
function detectComponentType(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('connector') || l.includes('conn') || l.includes('plug') || l.includes('socket') || l.includes('harness')) return 'connector';
  if (l.includes('relay')) return 'relay';
  if (l.includes('fuse') || l.includes('fuse box') || l.includes('fusebox')) return 'fuse';
  if (
    l.includes('ecu') || l.includes('pcm') || l.includes('bcm') || l.includes('abs') ||
    l.includes('ecm') || l.includes('tcm') || l.includes('controller') ||
    l.includes('control unit') || l.includes('control module') || l.includes('module')
  ) return 'ecu';
  if (
    l.includes('sensor') || l.includes('temp') || l.includes('o2') || l.includes('lambda') ||
    l.includes('speed') || l.includes('pressure') || l.includes('position') || l.includes('throttle')
  ) return 'sensor';
  if (
    l.includes('splice') || l.includes('junction') || l.includes('joint') ||
    l.match(/\bsp\d/i) || l.match(/\bj\d/i)
  ) return 'splice';
  if (l.includes('ground') || l.includes('gnd') || l.includes('earth') || l.match(/\bg\d/i)) return 'ground';
  if (l.includes('battery') || l.includes('batt')) return 'battery';
  if (l.includes('motor') || l.includes('actuator') || l.includes('pump') || l.includes('fan') || l.includes('starter')) return 'motor';
  if (l.includes('switch') || l.match(/\bsw\d/i)) return 'switch';
  if (l.includes('diode') || l.includes('led')) return 'diode';
  if (l.includes('resistor')) return 'resistor';
  if (l.includes('capacitor') || l.includes('cap')) return 'capacitor';
  if (l.includes('power') || l.includes('pwr') || l.includes('supply') || l.includes('distribution') || l.includes('pdb') || l.includes('pdm')) return 'power';
  return 'generic';
}
 
// ─── Colors per type ──────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { body: string; accent: string; emissive: string; legend: string }> = {
  connector: { body: '#2563EB', accent: '#1D4ED8', emissive: '#1e40af', legend: 'Connector' },
  relay:     { body: '#7C3AED', accent: '#6D28D9', emissive: '#4c1d95', legend: 'Relay' },
  fuse:      { body: '#D97706', accent: '#B45309', emissive: '#92400e', legend: 'Fuse' },
  ecu:       { body: '#059669', accent: '#047857', emissive: '#064e3b', legend: 'ECU / Module' },
  sensor:    { body: '#DC2626', accent: '#B91C1C', emissive: '#7f1d1d', legend: 'Sensor' },
  splice:    { body: '#6B7280', accent: '#4B5563', emissive: '#374151', legend: 'Splice' },
  ground:    { body: '#374151', accent: '#1F2937', emissive: '#111827', legend: 'Ground' },
  battery:   { body: '#16A34A', accent: '#15803D', emissive: '#14532d', legend: 'Battery' },
  motor:     { body: '#0891B2', accent: '#0E7490', emissive: '#164e63', legend: 'Motor' },
  switch:    { body: '#9333EA', accent: '#7E22CE', emissive: '#581c87', legend: 'Switch' },
  diode:     { body: '#F59E0B', accent: '#D97706', emissive: '#92400e', legend: 'Diode / LED' },
  resistor:  { body: '#8B5CF6', accent: '#7C3AED', emissive: '#4c1d95', legend: 'Resistor' },
  capacitor: { body: '#06B6D4', accent: '#0891B2', emissive: '#164e63', legend: 'Capacitor' },
  power:     { body: '#EF4444', accent: '#DC2626', emissive: '#7f1d1d', legend: 'Power / Dist.' },
  generic:   { body: '#94A3B8', accent: '#64748B', emissive: '#1e293b', legend: 'Generic' },
};
 
// ─── 3D Component Models ──────────────────────────────────────────────────────
 
/** Multi-pin connector housing */
const ConnectorModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Main housing */}
    <mesh>
      <boxGeometry args={[1.8, 0.72, 1.0]} />
      <meshStandardMaterial
        color={hovered ? '#60A5FA' : color.body}
        roughness={0.25} metalness={0.25}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Locking tab on top */}
    <mesh position={[0, 0.46, 0]}>
      <boxGeometry args={[1.1, 0.22, 0.28]} />
      <meshStandardMaterial color={color.accent} roughness={0.3} metalness={0.2} />
    </mesh>
    {/* 3×2 pin array on front face */}
    {[-0.52, 0, 0.52].map((x, i) =>
      [-0.18, 0.18].map((y, j) => (
        <mesh key={`${i}-${j}`} position={[x, y, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.35, 8]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
        </mesh>
      ))
    )}
  </group>
);
 
/** Relay – box body with coil housing bump */
const RelayModel = ({ color, hovered, isSelected }: any) => (
  <group>
    <mesh>
      <boxGeometry args={[1.3, 0.95, 1.2]} />
      <meshStandardMaterial
        color={hovered ? '#A78BFA' : color.body}
        roughness={0.3} metalness={0.15}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Coil housing on top */}
    <mesh position={[0, 0.67, 0]}>
      <boxGeometry args={[0.9, 0.38, 0.85]} />
      <meshStandardMaterial color={color.accent} roughness={0.4} metalness={0.1} />
    </mesh>
    {/* Blade pins underneath */}
    {[-0.42, 0, 0.42].map((x, i) => (
      <mesh key={i} position={[x, -0.7, 0.2]}>
        <boxGeometry args={[0.12, 0.3, 0.06]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
    ))}
    {[-0.42, 0.42].map((x, i) => (
      <mesh key={`r${i}`} position={[x, -0.7, -0.2]}>
        <boxGeometry args={[0.12, 0.3, 0.06]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
    ))}
  </group>
);
 
/** Blade fuse */
const FuseModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Plastic housing body (portrait blade fuse shape) */}
    <mesh>
      <boxGeometry args={[0.7, 1.1, 0.25]} />
      <meshStandardMaterial
        color={hovered ? '#FCD34D' : color.body}
        roughness={0.3} metalness={0.05}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Clear window on front to see wire element */}
    <mesh position={[0, 0.1, 0.14]}>
      <boxGeometry args={[0.3, 0.5, 0.02]} />
      <meshStandardMaterial color="#BFDBFE" transparent opacity={0.55} roughness={0.05} />
    </mesh>
    {/* Two metal blade legs */}
    <mesh position={[-0.15, -0.7, 0]}>
      <boxGeometry args={[0.1, 0.35, 0.12]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.85} roughness={0.15} />
    </mesh>
    <mesh position={[0.15, -0.7, 0]}>
      <boxGeometry args={[0.1, 0.35, 0.12]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.85} roughness={0.15} />
    </mesh>
    {/* Rating label band */}
    <mesh position={[0, 0.5, 0.13]}>
      <boxGeometry args={[0.5, 0.18, 0.02]} />
      <meshStandardMaterial color="#1F2937" roughness={0.9} />
    </mesh>
  </group>
);
 
/** ECU / control module – flat PCB-like housing */
const ECUModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Main board */}
    <mesh>
      <boxGeometry args={[1.9, 0.28, 1.45]} />
      <meshStandardMaterial
        color={hovered ? '#34D399' : color.body}
        roughness={0.5} metalness={0.2}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Connector strips on two long edges */}
    <mesh position={[0, 0.14, 0.78]}>
      <boxGeometry args={[1.65, 0.25, 0.14]} />
      <meshStandardMaterial color="#1F2937" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.14, -0.78]}>
      <boxGeometry args={[1.65, 0.25, 0.14]} />
      <meshStandardMaterial color="#1F2937" roughness={0.6} />
    </mesh>
    {/* Aluminium heat spreader lid */}
    <mesh position={[0, 0.27, 0]}>
      <boxGeometry args={[1.6, 0.14, 1.25]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.65} roughness={0.2} />
    </mesh>
    {/* MCU chip */}
    <mesh position={[0, 0.38, 0.15]}>
      <boxGeometry args={[0.5, 0.09, 0.5]} />
      <meshStandardMaterial color="#111827" roughness={0.85} />
    </mesh>
    {/* Small capacitors on board */}
    {[-0.6, 0.6].map((x, i) => (
      <mesh key={i} position={[x, 0.24, -0.3]}>
        <cylinderGeometry args={[0.07, 0.07, 0.18, 8]} />
        <meshStandardMaterial color="#D97706" roughness={0.4} />
      </mesh>
    ))}
  </group>
);
 
/** Sensor – hex body + threaded tip */
const SensorModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Hex body */}
    <mesh>
      <cylinderGeometry args={[0.38, 0.38, 0.65, 6]} />
      <meshStandardMaterial
        color={hovered ? '#F87171' : color.body}
        roughness={0.3} metalness={0.55}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Threaded stud tip */}
    <mesh position={[0, -0.52, 0]}>
      <cylinderGeometry args={[0.17, 0.17, 0.42, 16]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.75} roughness={0.2} />
    </mesh>
    {/* Tip (sensing element) */}
    <mesh position={[0, -0.8, 0]}>
      <sphereGeometry args={[0.12, 10, 10]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.1} />
    </mesh>
    {/* Plastic connector cap */}
    <mesh position={[0, 0.52, 0]}>
      <cylinderGeometry args={[0.24, 0.24, 0.28, 16]} />
      <meshStandardMaterial color="#1F2937" roughness={0.55} />
    </mesh>
    {/* Pins */}
    {[-0.1, 0.1].map((x, i) => (
      <mesh key={i} position={[x, 0.8, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.28, 8]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.1} />
      </mesh>
    ))}
  </group>
);
 
/** Splice / junction point – heat-shrink sleeve with wire stubs */
const SpliceModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Heat-shrink sleeve */}
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.22, 0.22, 0.9, 14]} />
      <meshStandardMaterial
        color={hovered ? '#9CA3AF' : color.body}
        roughness={0.55}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Wire stubs – left, right, front */}
    {[
      { pos: [-0.65, 0, 0] as [number,number,number], rot: [0, 0, Math.PI / 2] as [number,number,number] },
      { pos: [0.65, 0, 0]  as [number,number,number], rot: [0, 0, Math.PI / 2] as [number,number,number] },
      { pos: [0, 0, 0.55]  as [number,number,number], rot: [Math.PI / 2, 0, 0] as [number,number,number] },
    ].map(({ pos, rot }, i) => (
      <mesh key={i} position={pos} rotation={rot}>
        <cylinderGeometry args={[0.07, 0.07, 0.28, 8]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.1} />
      </mesh>
    ))}
  </group>
);
 
/** Ground point – stud, ring terminal, plate */
const GroundModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Ground plate */}
    <mesh position={[0, -0.32, 0]}>
      <boxGeometry args={[0.85, 0.08, 0.85]} />
      <meshStandardMaterial
        color={hovered ? '#6B7280' : color.body}
        roughness={0.4} metalness={0.6}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Stud bolt */}
    <mesh position={[0, 0.12, 0]}>
      <cylinderGeometry args={[0.1, 0.1, 0.7, 8]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Hex nut */}
    <mesh position={[0, 0.42, 0]}>
      <cylinderGeometry args={[0.16, 0.16, 0.13, 6]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Ring terminal */}
    <mesh position={[0, 0.54, 0]}>
      <torusGeometry args={[0.2, 0.055, 8, 16]} />
      <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.1} />
    </mesh>
  </group>
);
 
/** Battery */
const BatteryModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Main case */}
    <mesh>
      <boxGeometry args={[1.7, 1.0, 1.1]} />
      <meshStandardMaterial
        color={hovered ? '#4ADE80' : color.body}
        roughness={0.5}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Top cover */}
    <mesh position={[0, 0.55, 0]}>
      <boxGeometry args={[1.7, 0.1, 1.1]} />
      <meshStandardMaterial color="#1F2937" roughness={0.6} />
    </mesh>
    {/* Positive terminal (red) */}
    <mesh position={[0.45, 0.72, 0]}>
      <cylinderGeometry args={[0.14, 0.14, 0.28, 12]} />
      <meshStandardMaterial color="#EF4444" metalness={0.7} roughness={0.2} />
    </mesh>
    {/* Negative terminal (black) */}
    <mesh position={[-0.45, 0.72, 0]}>
      <cylinderGeometry args={[0.14, 0.14, 0.28, 12]} />
      <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.2} />
    </mesh>
    {/* Label plate on side */}
    <mesh position={[0, 0.1, 0.56]}>
      <boxGeometry args={[1.35, 0.5, 0.015]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
    </mesh>
  </group>
);
 
/** Motor / actuator / pump */
const MotorModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Cylindrical can */}
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 1.2, 22]} />
      <meshStandardMaterial
        color={hovered ? '#38BDF8' : color.body}
        roughness={0.3} metalness={0.4}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Output shaft */}
    <mesh position={[0, 0, 0.76]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.09, 0.09, 0.55, 12]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.9} roughness={0.1} />
    </mesh>
    {/* Rear end cap */}
    <mesh position={[0, 0, -0.66]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 0.08, 22]} />
      <meshStandardMaterial color={color.accent} roughness={0.4} metalness={0.3} />
    </mesh>
    {/* Connector box on top */}
    <mesh position={[0.52, 0, 0]}>
      <boxGeometry args={[0.3, 0.32, 0.46]} />
      <meshStandardMaterial color="#1F2937" roughness={0.6} />
    </mesh>
  </group>
);
 
/** Switch */
const SwitchModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Body */}
    <mesh>
      <boxGeometry args={[1.3, 0.55, 0.9]} />
      <meshStandardMaterial
        color={hovered ? '#C084FC' : color.body}
        roughness={0.3} metalness={0.15}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Toggle rocker */}
    <mesh position={[0, 0.38, 0]} rotation={[0.3, 0, 0]}>
      <boxGeometry args={[0.8, 0.18, 0.5]} />
      <meshStandardMaterial color={color.accent} roughness={0.25} metalness={0.2} />
    </mesh>
    {/* Blade terminals */}
    {[-0.35, 0.35].map((x, i) => (
      <mesh key={i} position={[x, -0.45, 0]}>
        <boxGeometry args={[0.1, 0.28, 0.06]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
    ))}
  </group>
);
 
/** Diode / LED – glass body with polarity band */
const DiodeModel = ({ color, hovered, isSelected }: any) => (
  <group rotation={[0, 0, Math.PI / 2]}>
    {/* Glass body */}
    <mesh>
      <cylinderGeometry args={[0.17, 0.17, 0.68, 12]} />
      <meshStandardMaterial
        color={hovered ? '#FCD34D' : color.body}
        roughness={0.08} metalness={0.05}
        transparent opacity={0.82}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Cathode stripe */}
    <mesh position={[0, 0.28, 0]}>
      <cylinderGeometry args={[0.18, 0.18, 0.1, 12]} />
      <meshStandardMaterial color="#1F2937" roughness={0.5} />
    </mesh>
    {/* Anode lead */}
    <mesh position={[0, -0.56, 0]}>
      <cylinderGeometry args={[0.035, 0.035, 0.46, 8]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Cathode lead */}
    <mesh position={[0, 0.56, 0]}>
      <cylinderGeometry args={[0.035, 0.035, 0.46, 8]} />
      <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
    </mesh>
  </group>
);
 
/** Resistor – small cylinder with colour bands */
const ResistorModel = ({ color, hovered, isSelected }: any) => (
  <group rotation={[0, 0, Math.PI / 2]}>
    <mesh>
      <cylinderGeometry args={[0.15, 0.15, 0.72, 12]} />
      <meshStandardMaterial
        color={hovered ? '#C4B5FD' : '#D4C5A0'}
        roughness={0.4}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Colour bands */}
    {[-0.22, -0.06, 0.1, 0.24].map((y, i) => (
      <mesh key={i} position={[0, y, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.07, 12]} />
        <meshStandardMaterial color={['#B91C1C','#1D4ED8','#D97706','#C0C0C0'][i]} roughness={0.5} />
      </mesh>
    ))}
    {[-0.52, 0.52].map((y, i) => (
      <mesh key={`l${i}`} position={[0, y, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.35, 8]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
      </mesh>
    ))}
  </group>
);
 
/** Capacitor – electrolytic can */
const CapacitorModel = ({ color, hovered, isSelected }: any) => (
  <group>
    <mesh>
      <cylinderGeometry args={[0.3, 0.3, 0.85, 16]} />
      <meshStandardMaterial
        color={hovered ? '#67E8F9' : color.body}
        roughness={0.3} metalness={0.4}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Top vent */}
    <mesh position={[0, 0.45, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
      <meshStandardMaterial color="#E5E7EB" metalness={0.5} roughness={0.3} />
    </mesh>
    {/* Polarity stripe */}
    <mesh position={[0.2, 0.1, 0]}>
      <boxGeometry args={[0.04, 0.65, 0.62]} />
      <meshStandardMaterial color="#1F2937" roughness={0.8} />
    </mesh>
    {/* Leads */}
    {[-0.1, 0.1].map((x, i) => (
      <mesh key={i} position={[x, -0.56, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
      </mesh>
    ))}
  </group>
);
 
/** Power distribution box */
const PowerModel = ({ color, hovered, isSelected }: any) => (
  <group>
    {/* Main enclosure */}
    <mesh>
      <boxGeometry args={[1.7, 0.6, 1.25]} />
      <meshStandardMaterial
        color={hovered ? '#F87171' : color.body}
        roughness={0.4} metalness={0.2}
        emissive={isSelected ? color.emissive : '#000'}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
    {/* Lid with slight ridge */}
    <mesh position={[0, 0.38, 0]}>
      <boxGeometry args={[1.75, 0.18, 1.3]} />
      <meshStandardMaterial color={color.accent} roughness={0.5} metalness={0.1} />
    </mesh>
    {/* Fuse holders on lid */}
    {[-0.5, 0, 0.5].map((x, i) => (
      <mesh key={i} position={[x, 0.49, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.22, 8]} />
        <meshStandardMaterial color="#D97706" roughness={0.3} metalness={0.4} />
      </mesh>
    ))}
    {/* Connector on one end */}
    <mesh position={[0, 0, 0.7]}>
      <boxGeometry args={[1.3, 0.38, 0.12]} />
      <meshStandardMaterial color="#1F2937" roughness={0.6} />
    </mesh>
  </group>
);
 
/** Fallback box */
const GenericModel = ({ hovered, isSelected }: any) => (
  <group>
    <mesh>
      <boxGeometry args={[1.8, 0.8, 1.2]} />
      <meshStandardMaterial
        color={hovered ? '#F1F5F9' : '#FFFFFF'}
        emissive={isSelected ? THEME.accent : '#000000'}
        emissiveIntensity={isSelected ? 0.2 : 0}
        roughness={0.1} metalness={0.1}
      />
    </mesh>
    <mesh>
      <boxGeometry args={[1.82, 0.82, 1.22]} />
      <meshBasicMaterial color={isSelected ? THEME.accent : THEME.edge} wireframe transparent opacity={0.4} />
    </mesh>
  </group>
);
 
// ─── Model registry ───────────────────────────────────────────────────────────
const COMPONENT_MODELS: Record<string, React.FC<any>> = {
  connector: ConnectorModel,
  relay:     RelayModel,
  fuse:      FuseModel,
  ecu:       ECUModel,
  sensor:    SensorModel,
  splice:    SpliceModel,
  ground:    GroundModel,
  battery:   BatteryModel,
  motor:     MotorModel,
  switch:    SwitchModel,
  diode:     DiodeModel,
  resistor:  ResistorModel,
  capacitor: CapacitorModel,
  power:     PowerModel,
  generic:   GenericModel,
};
 
// ─── CameraController ─────────────────────────────────────────────────────────
const CameraController = ({ targetNode, orbitEnabled }: { targetNode: any; orbitEnabled: boolean }) => {
  const controlsRef = useRef<any>(null);
  useFrame(() => {
    if (targetNode && controlsRef.current) {
      const targetPos = new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z);
      controlsRef.current.target.lerp(targetPos, 0.05);
      controlsRef.current.update();
    }
  });
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={5}
      maxDistance={150}
      enabled={orbitEnabled}
      enablePan
      enableZoom
      enableRotate
    />
  );
};
 
// ─── DraggableNode ────────────────────────────────────────────────────────────
const DraggableNode = ({
  node, isSelected, setSelectedItem, updatePosition, setOrbitEnabled, saveHistory,
}: any) => {
  const meshRef = useRef<THREE.Group>(null);
  const transformRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
 
  const componentType = detectComponentType(node.label);
  const colors = TYPE_COLORS[componentType] ?? TYPE_COLORS.generic;
  const ComponentModel = COMPONENT_MODELS[componentType] ?? GenericModel;
 
  useEffect(() => {
    const controls = transformRef.current;
    if (controls) {
      const callback = (e: any) => setOrbitEnabled(!e.value);
      controls.addEventListener('dragging-changed', callback);
      return () => controls.removeEventListener('dragging-changed', callback);
    }
  }, [isSelected, setOrbitEnabled]);

  return (
    <>
      <group ref={meshRef} position={[node.x, node.y, node.z]}>
        <group
          onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'node', ...node }); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <ComponentModel color={colors} hovered={hovered} isSelected={isSelected} />
 
          <Billboard follow={true}>
            {/* Component label */}
            <Text
              position={[0, 1.35, 0]}
              fontSize={0.28}
              color={isSelected ? THEME.accent : THEME.text}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {node.label}
            </Text>
            {/* Type badge */}
            <Text
              position={[0, 1.0, 0]}
              fontSize={0.17}
              color={colors.body}
              anchorX="center"
              anchorY="middle"
            >
              {colors.legend}
            </Text>
          </Billboard>
        </group>
      </group>
 
      {isSelected && (
        <TransformControls
          ref={transformRef}
          object={meshRef as any}
          mode="translate"
          onMouseDown={() => { saveHistory(); }}
          onObjectChange={() => {
            if (meshRef.current) {
              updatePosition(node.id, meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z);
            }
          }}
        />
      )}
    </>
  );
};
 
// ─── Viewer3D ─────────────────────────────────────────────────────────────────
export const Viewer3D: React.FC = () => {
  const { data, selectedItem, setSelectedItem, updateNodePosition3D, saveHistory } = useStore();
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [hideOthers, setHideOthers] = useState(false);
 
  // Reset isolation whenever selection changes
  useEffect(() => { setHideOthers(false); }, [selectedItem?.id]);
 
  if (!data) return (
    <div className="w-full h-full flex items-center justify-center text-[#0284C7] bg-[#F8F9FA]">
      INITIALIZING 3D ENGINE...
    </div>
  );
 
  const rawNodes = data.connectors || data.nodes || [];
  const rawWires = data.wires || data.connections || [];
 
  const safeNodes = useMemo(() => {
    const nodes = rawNodes.map((n: any, i: number) => {
      let x = n.x !== undefined ? n.x : (n.coordinates_3d?.x !== undefined ? n.coordinates_3d.x * SCALE : null);
      let y = n.y !== undefined ? n.y : (n.coordinates_3d?.y !== undefined ? n.coordinates_3d.y * SCALE : null);
      let z = n.z !== undefined ? n.z : (n.coordinates_3d?.z !== undefined ? n.coordinates_3d.z * SCALE : null);
 
      if (x === null || y === null || z === null) {
        const columns = Math.ceil(Math.sqrt(rawNodes.length));
        x = ((i % columns) * 20) - 20;
        y = 0;
        z = (Math.floor(i / columns) * 20) - 20;
      }
      return { ...n, x, y, z, id: n.id || `node_${i}`, label: n.label || n.id || 'COMPONENT' };
    });
 
    for (let iter = 0; iter < 15; iter++) {
      let hasOverlap = false;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i], n2 = nodes[j];
          const r1 = { minX: n1.x - 0.9, maxX: n1.x + 0.9, minY: n1.y - 0.4, maxY: n1.y + 0.4, minZ: n1.z - 0.6, maxZ: n1.z + 0.6 };
          const r2 = { minX: n2.x - 0.9, maxX: n2.x + 0.9, minY: n2.y - 0.4, maxY: n2.y + 0.4, minZ: n2.z - 0.6, maxZ: n2.z + 0.6 };
          if (r1.minX < r2.maxX + 2 && r1.maxX + 2 > r2.minX && r1.minY < r2.maxY + 2 && r1.maxY + 2 > r2.minY && r1.minZ < r2.maxZ + 2 && r1.maxZ + 2 > r2.minZ) {
            hasOverlap = true;
            const pushX = Math.min((r2.maxX + 2) - r1.minX, (r1.maxX + 2) - r2.minX);
            const pushY = Math.min((r2.maxY + 2) - r1.minY, (r1.maxY + 2) - r2.minY);
            const pushZ = Math.min((r2.maxZ + 2) - r1.minZ, (r1.maxZ + 2) - r2.minZ);
            const minP = Math.min(pushX, pushY, pushZ);
            if (minP === pushX) { const dir = n1.x < n2.x ? -1 : 1; n1.x += (pushX / 2) * dir; n2.x -= (pushX / 2) * dir; }
            else if (minP === pushY) { const dir = n1.y < n2.y ? -1 : 1; n1.y += (pushY / 2) * dir; n2.y -= (pushY / 2) * dir; }
            else { const dir = n1.z < n2.z ? -1 : 1; n1.z += (pushZ / 2) * dir; n2.z -= (pushZ / 2) * dir; }
          }
        }
      }
      if (!hasOverlap) break;
    }
    return nodes;
  }, [rawNodes]);
 
  const targetNodeForCamera = selectedItem?.type === 'node'
    ? safeNodes.find((n: any) => n.id === selectedItem.id)
    : null;
 
  // Collect only types actually present in the netlist
  const presentTypes = useMemo(() => {
    const seen = new Set<string>();
    safeNodes.forEach((n: any) => seen.add(detectComponentType(n.label)));
    return [...seen];
  }, [safeNodes]);
 
  // ── Isolation: build the visible-node set when "hide others" is active ──────
  const { visibleNodeIds, visibleWireIndices } = useMemo(() => {
    if (!hideOthers || selectedItem?.type !== 'node') {
      return { visibleNodeIds: null, visibleWireIndices: null };
    }
    const selId = selectedItem.id;
    const connectedNodeIds = new Set<string>([selId]);
    const wireIndices = new Set<number>();
    rawWires.forEach((wire: any, i: number) => {
      if (wire.source === selId || wire.target === selId) {
        connectedNodeIds.add(wire.source);
        connectedNodeIds.add(wire.target);
        wireIndices.add(i);
      }
    });
    return { visibleNodeIds: connectedNodeIds, visibleWireIndices: wireIndices };
  }, [hideOthers, selectedItem, rawWires]);
 
  const canIsolate = selectedItem?.type === 'node';
 
  return (
    <div className="w-full h-full bg-[#F8F9FA] relative">
 
      {/* ── Type legend ── */}
      <div
        className="absolute top-3 right-3 z-10 rounded-lg p-2.5 text-xs shadow border"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(6px)',
          borderColor: '#E2E8F0',
          minWidth: 130,
          maxWidth: 160,
        }}
      >
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Components
        </div>
        {presentTypes.map((type) => {
          const c = TYPE_COLORS[type] ?? TYPE_COLORS.generic;
          return (
            <div key={type} className="flex items-center gap-2 mb-1">
              <span style={{ width: 10, height: 10, borderRadius: 2, background: c.body, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: '#374151' }}>{c.legend}</span>
            </div>
          );
        })}
 
        {/* ── Hide Others button ── */}
        <div style={{ marginTop: 10, borderTop: '1px solid #E2E8F0', paddingTop: 10 }}>
          <button
            onClick={() => {
              if (!canIsolate) return;
              setHideOthers((prev) => !prev);
            }}
            disabled={!canIsolate}
            title={canIsolate ? (hideOthers ? 'Show all components' : 'Hide unconnected components') : 'Select a component first'}
            style={{
              width: '100%',
              padding: '5px 8px',
              borderRadius: 6,
              border: 'none',
              cursor: canIsolate ? 'pointer' : 'not-allowed',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.03em',
              transition: 'background 0.15s, color 0.15s',
              background: hideOthers
                ? '#0284C7'
                : canIsolate
                  ? '#EFF6FF'
                  : '#F1F5F9',
              color: hideOthers
                ? '#FFFFFF'
                : canIsolate
                  ? '#1D4ED8'
                  : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            {/* Eye icon */}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              {hideOthers ? (
                /* eye-off */
                <>
                  <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M6.5 6.6A3 3 0 0 0 9.4 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M4.2 4.3C2.9 5.2 1.8 6.5 1 8c1.5 3 4 5 7 5 1.3 0 2.5-.4 3.6-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M8 3c3 0 5.5 2 7 5-.4.8-1 1.7-1.7 2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </>
              ) : (
                /* eye */
                <>
                  <ellipse cx="8" cy="8" rx="7" ry="5" stroke="currentColor" strokeWidth="1.6"/>
                  <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6"/>
                </>
              )}
            </svg>
            {hideOthers ? 'Show All' : 'Hide Others'}
          </button>
          {!canIsolate && (
            <div style={{ marginTop: 4, fontSize: 10, color: '#94A3B8', textAlign: 'center' }}>
              Select a component first
            </div>
          )}
        </div>
      </div>
 
      <Canvas
        camera={{ position: [20, 15, 25], fov: 45 }}
        onPointerMissed={() => setSelectedItem(null)}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[10, 20, 10]} intensity={2} castShadow />
        <directionalLight position={[-8, -4, -8]} intensity={0.5} />
 
        <CameraController targetNode={targetNodeForCamera} orbitEnabled={orbitEnabled} />
 
        {/* Wires */}
        {rawWires.map((wire: any, index: number) => {
          // Isolation: skip wires not in the focused set
          if (visibleWireIndices && !visibleWireIndices.has(index)) return null;
 
          const s = safeNodes.find((c: any) => c.id === wire.source);
          const t = safeNodes.find((c: any) => c.id === wire.target);
          if (!s || !t) return null;
          const isH =
            (selectedItem?.type === 'node' && (wire.source === selectedItem.id || wire.target === selectedItem.id)) ||
            (selectedItem?.type === 'wire' && selectedItem.id === wire.id);
          const sD = selectedItem !== null && !isH;
          return (
            <Line
              key={wire.id || index}
              points={[new THREE.Vector3(s.x, s.y, s.z), new THREE.Vector3(t.x, t.y, t.z)]}
              color={wire.color || THEME.accent}
              lineWidth={isH ? 5 : 1.5}
              opacity={isH ? 1 : (sD ? 0.08 : 0.7)}
              transparent
            />
          );
        })}
 
        {/* Nodes */}
        {safeNodes
          .filter((node: any) => !visibleNodeIds || visibleNodeIds.has(node.id))
          .map((node: any) => (
          <DraggableNode
            key={node.id}
            node={node}
            isSelected={selectedItem?.id === node.id}
            setSelectedItem={setSelectedItem}
            setOrbitEnabled={setOrbitEnabled}
            saveHistory={saveHistory}
            updatePosition={(id: string, x: number, y: number, z: number) => updateNodePosition3D(id, x, y, z)}
          />
        ))}
      </Canvas>
    </div>
  );
};