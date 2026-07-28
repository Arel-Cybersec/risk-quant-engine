import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useTheme, cssVar } from "@/lib/theme";
import { useMounted } from "@/hooks/use-mounted";

const SEG = 28;
const SIZE = 9;

function Surface({
  likelihood,
  impact,
  damp,
  colorLow,
  colorHigh,
}: {
  likelihood: number;
  impact: number;
  damp: number;
  colorLow: string;
  colorHigh: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);
  const markerRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    g.rotateX(-Math.PI / 2);
    const colors = new Float32Array((SEG + 1) * (SEG + 1) * 3);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  const wireGeo = useMemo(() => new THREE.WireframeGeometry(geometry), [geometry]);

  const cLow = useMemo(() => new THREE.Color(colorLow), [colorLow]);
  const cHigh = useMemo(() => new THREE.Color(colorHigh), [colorHigh]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const col = geometry.attributes.color as THREE.BufferAttribute;
    const tmp = new THREE.Color();

    // Risk peak location in plane space, driven by likelihood (X) and impact (Z)
    const px = ((likelihood - 3) / 4) * SIZE;
    const pz = -((impact - 3) / 4) * SIZE;
    const amplitude = ((likelihood * impact) / 25) * 2.6 * damp + 0.25;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x - px, z - pz);
      const peak = amplitude * Math.exp(-(d * d) / 6);
      const wave = Math.sin(x * 0.55 + t * 0.9) * Math.cos(z * 0.55 - t * 0.7) * 0.18;
      const y = peak + wave;
      pos.setY(i, y);
      const k = THREE.MathUtils.clamp(y / (amplitude + 0.4), 0, 1);
      tmp.copy(cLow).lerp(cHigh, k);
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    geometry.computeVertexNormals();

    wireGeo.dispose?.();
    if (wireRef.current) {
      const next = new THREE.WireframeGeometry(geometry);
      wireRef.current.geometry.dispose();
      wireRef.current.geometry = next;
    }

    if (markerRef.current) {
      markerRef.current.position.set(px, amplitude + 0.55 + Math.sin(t * 2.2) * 0.08, pz);
    }
    if (meshRef.current?.parent) {
      meshRef.current.parent.rotation.y = Math.sin(t * 0.12) * 0.22 + state.pointer.x * 0.35;
    }
  });

  return (
    <group rotation={[0, 0.3, 0]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial vertexColors transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments ref={wireRef} geometry={wireGeo}>
        <lineBasicMaterial color={colorHigh} transparent opacity={0.42} />
      </lineSegments>
      <mesh ref={markerRef}>
        <octahedronGeometry args={[0.24, 0]} />
        <meshBasicMaterial color={colorHigh} wireframe />
      </mesh>
    </group>
  );
}

/** Interactive 3D risk surface: X = likelihood, Z = impact, Y = risk elevation. */
export function RiskSurface3D({
  likelihood,
  impact,
  damp,
}: {
  likelihood: number;
  impact: number;
  damp: number;
}) {
  const mounted = useMounted();
  const { theme } = useTheme();
  if (!mounted) {
    return <div className="h-[280px] w-full animate-pulse rounded-md bg-panel2/50" />;
  }
  const low = cssVar("--teal", "#2dd9c4");
  const high = cssVar("--primary");

  return (
    <div className="h-[280px] w-full cursor-crosshair">
      <Canvas key={theme} camera={{ position: [0, 6.4, 10], fov: 42 }} dpr={[1, 1.7]}>
        <Surface
          likelihood={likelihood}
          impact={impact}
          damp={damp}
          colorLow={low}
          colorHigh={high}
        />
      </Canvas>
    </div>
  );
}
