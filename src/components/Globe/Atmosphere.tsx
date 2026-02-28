import { GLOBE_RADIUS } from "../../utils/coordinates";

export default function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS + 0.15, 64, 64]} />
      <meshBasicMaterial color="#1abc9c" transparent opacity={0.06} />
    </mesh>
  );
}
