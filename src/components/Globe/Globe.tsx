import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { GLOBE_RADIUS } from "../../utils/coordinates";
import Atmosphere from "./Atmosphere";
import EventMarkers from "./EventMarkers";

export default function Globe() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Globe sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#1a5276" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Wireframe overlay for landmass feel */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.005, 32, 32]} />
        <meshBasicMaterial color="#2980b9" wireframe opacity={0.15} transparent />
      </mesh>

      <Atmosphere />
      <EventMarkers />
    </group>
  );
}
