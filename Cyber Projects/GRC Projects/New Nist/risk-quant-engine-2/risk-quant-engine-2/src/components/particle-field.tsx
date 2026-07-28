import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useTheme, cssVar } from "@/lib/theme";
import { useMounted } from "@/hooks/use-mounted";

function Particles({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  const { positions, speeds, count } = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      speeds[i] = 0.15 + Math.random() * 0.5;
    }
    return { positions, speeds, count };
  }, []);

  useFrame((state, delta) => {
    const pts = ref.current;
    if (!pts) return;
    // Spring-eased cursor tracking
    mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 2.4);
    mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 2.4);

    const arr = pts.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta * 0.35;
      if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = -8;
      arr[i * 3] += Math.sin(t * 0.2 + i) * delta * 0.02;
    }
    pts.geometry.attributes.position.needsUpdate = true;

    pts.rotation.y = mouse.current.x * 0.28;
    pts.rotation.x = -mouse.current.y * 0.18;
    pts.position.x = mouse.current.x * viewport.width * 0.04;
    pts.position.y = mouse.current.y * viewport.height * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Ambient 3D particle field that drifts and parallaxes with the cursor. */
export function ParticleField() {
  const mounted = useMounted();
  const { theme } = useTheme();
  if (!mounted) return null;
  const color = cssVar("--primary");

  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
      <Canvas key={theme} camera={{ position: [0, 0, 12], fov: 55 }} dpr={[1, 1.6]}>
        <Particles color={color} />
      </Canvas>
    </div>
  );
}
