import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export function FloatingDocsRing({ count = 8, radius = 3.5 }) {
  const groupRef = useRef();

  const docs = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.sin(i * 1.5) * 0.6);
    const rotZ = (Math.random() - 0.5) * 0.3;
    const rotX = (Math.random() - 0.5) * 0.3;
    const isLabReport = i % 2 === 0;

    return { id: i, pos: [x, y, z], rot: [rotX, -angle + Math.PI / 2, rotZ], isLabReport };
  });

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central Pulsing Red Time Core */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 1.6, 24]} />
        <meshStandardMaterial
          color="#0B1B29"
          emissive="#E8734A"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      <pointLight color="#E8734A" intensity={2} distance={5} />

      {/* Floating Prescription and Lab Report Cards */}
      {docs.map((doc) => (
        <group key={doc.id} position={doc.pos} rotation={doc.rot}>
          <RoundedBox args={[0.9, 1.2, 0.02]} radius={0.03} smoothness={2}>
            <meshStandardMaterial
              color="#13324B"
              roughness={0.4}
              metalness={0.5}
              transparent
              opacity={0.85}
            />
          </RoundedBox>

          {/* Abstract Text Lines on the Card */}
          <mesh position={[-0.15, 0.35, 0.02]}>
            <planeGeometry args={[0.5, 0.06]} />
            <meshBasicMaterial color={doc.isLabReport ? "#28B0B3" : "#E8734A"} />
          </mesh>
          <mesh position={[0, 0.15, 0.02]}>
            <planeGeometry args={[0.7, 0.03]} />
            <meshBasicMaterial color="#94A3B8" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 0.02, 0.02]}>
            <planeGeometry args={[0.7, 0.03]} />
            <meshBasicMaterial color="#94A3B8" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, -0.11, 0.02]}>
            <planeGeometry args={[0.7, 0.03]} />
            <meshBasicMaterial color="#94A3B8" transparent opacity={0.4} />
          </mesh>
          <mesh position={[-0.1, -0.28, 0.02]}>
            <planeGeometry args={[0.5, 0.05]} />
            <meshBasicMaterial color={doc.isLabReport ? "#6E5AA8" : "#28B0B3"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
