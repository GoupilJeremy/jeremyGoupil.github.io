import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";
import type { HistoricalEvent } from "../../types";
import { latLngToVector3 } from "../../utils/coordinates";
import { useAppStore } from "../../stores/appStore";
import categoriesData from "../../data/categories.json";

interface EventMarkerProps {
  event: HistoricalEvent;
}

export default function EventMarker({ event }: EventMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);

  const position = latLngToVector3(event.location.lat, event.location.lng, 2, 0.08);
  const category = categoriesData.find((c) => c.id === event.category);
  const color = category?.color ?? "#1abc9c";

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => setSelectedEvent(event)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.5 : 1}
      >
        <octahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
        />
      </mesh>

      {hovered && (
        <Html distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: "rgba(15,15,35,0.9)",
              color: "#ecf0f1",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              whiteSpace: "nowrap",
              border: `1px solid ${color}`,
            }}
          >
            {event.title}
          </div>
        </Html>
      )}
    </group>
  );
}
