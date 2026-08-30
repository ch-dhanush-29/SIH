import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Ring } from '@react-three/drei';
import * as THREE from 'three';

export function KioskModel({ scale = 1, interactive = true }) {
  const groupRef = useRef();
  const screenGlowRef = useRef();
  const scannerLightRef = useRef();
  const ringRef = useRef();

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15 + (interactive ? (state.pointer.x * 0.2) : 0);
      groupRef.current.rotation.x = (interactive ? (-state.pointer.y * 0.1) : 0);
    }
    if (screenGlowRef.current) {
      screenGlowRef.current.intensity = 1.2 + Math.sin(t * 3) * 0.3;
    }
    if (scannerLightRef.current) {
      scannerLightRef.current.position.z = Math.sin(t * 2) * 0.25;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, -0.2, 0]}>
      {/* Base Pedestal */}
      <mesh position={[0, -1.6, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.25, 32]} />
        <meshStandardMaterial color="#0B1B29" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Base Glowing Accent Ring */}
      <mesh position={[0, -1.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.95, 32]} />
        <meshBasicMaterial color="#1F8A8C" side={THREE.DoubleSide} />
      </mesh>

      {/* Main Column Chassis */}
      <RoundedBox args={[0.7, 2.4, 0.35]} radius={0.06} smoothness={4} position={[0, -0.3, 0]}>
        <meshStandardMaterial color="#13324B" roughness={0.2} metalness={0.7} />
      </RoundedBox>

      {/* Rear Accent Spine */}
      <RoundedBox args={[0.5, 2.2, 0.15]} radius={0.04} smoothness={4} position={[0, -0.3, -0.22]}>
        <meshStandardMaterial color="#07121C" roughness={0.5} metalness={0.9} />
      </RoundedBox>

      {/* Terminal Head Unit (Angled) */}
      <group position={[0, 0.7, 0.1]} rotation={[0.2, 0, 0]}>
        {/* Bezel */}
        <RoundedBox args={[1.3, 1.0, 0.12]} radius={0.05} smoothness={4} position={[0, 0, 0]}>
          <meshStandardMaterial color="#07121C" roughness={0.1} metalness={0.9} />
        </RoundedBox>

        {/* Display Screen */}
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[1.15, 0.85]} />
          <meshStandardMaterial
            color="#082338"
            emissive="#1F8A8C"
            emissiveIntensity={0.6}
            roughness={0.1}
          />
        </mesh>

        {/* Dynamic Display UI Grid elements */}
        <mesh position={[0, 0.22, 0.08]}>
          <planeGeometry args={[0.95, 0.18]} />
          <meshBasicMaterial color="#28B0B3" transparent opacity={0.85} />
        </mesh>
        
        <mesh position={[-0.25, -0.1, 0.08]}>
          <planeGeometry args={[0.4, 0.35]} />
          <meshBasicMaterial color="#13324B" transparent opacity={0.9} />
        </mesh>

        <mesh position={[0.25, -0.1, 0.08]}>
          <planeGeometry args={[0.4, 0.35]} />
          <meshBasicMaterial color="#6E5AA8" transparent opacity={0.6} />
        </mesh>

        {/* Screen Light */}
        <pointLight ref={screenGlowRef} color="#4ED0D3" distance={3} intensity={1.5} position={[0, 0, 0.4]} />
      </group>

      {/* Document Scanner Tray Bay */}
      <group position={[0, -0.1, 0.32]} rotation={[-0.15, 0, 0]}>
        <RoundedBox args={[0.85, 0.12, 0.45]} radius={0.03} smoothness={4}>
          <meshStandardMaterial color="#0B1B29" roughness={0.4} metalness={0.6} />
        </RoundedBox>
        
        {/* Scanner Glass Bed */}
        <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.75, 0.35]} />
          <meshStandardMaterial color="#1F8A8C" transparent opacity={0.5} roughness={0.1} />
        </mesh>

        {/* Moving Laser Scanner Light Bar */}
        <mesh ref={scannerLightRef} position={[0, 0.07, 0]}>
          <boxGeometry args={[0.7, 0.015, 0.03]} />
          <meshBasicMaterial color="#E8734A" />
        </mesh>
      </group>

      {/* Floating Holographic Ambient Ring */}
      <group ref={ringRef} position={[0, 0.7, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <Ring args={[1.2, 1.23, 48]}>
          <meshBasicMaterial color="#28B0B3" side={THREE.DoubleSide} transparent opacity={0.4} />
        </Ring>
      </group>
    </group>
  );
}
