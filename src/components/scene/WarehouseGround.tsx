import { useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

export function WarehouseGround() {
  const { structure, layers } = useAppStore();
  const { width = 30, depth = 20 } = structure?.groundSize ?? {};
  const halfW = width / 2;
  const halfD = depth / 2;

  const gridTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#06101F';
    ctx.fillRect(0, 0, 1024, 1024);
    const gridColor = 'rgba(0, 212, 255, 0.45)';
    const gridColorSub = 'rgba(0, 212, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 30; i++) {
      const x = (i / 30) * 1024;
      ctx.strokeStyle = i % 5 === 0 ? gridColor : gridColorSub;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let i = 0; i <= 20; i++) {
      const y = (i / 20) * 1024;
      ctx.strokeStyle = i % 5 === 0 ? gridColor : gridColorSub;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  if (!layers.warehouse) return null;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width + 4, depth + 4]} />
        <meshStandardMaterial
          color={'#040A17'}
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial map={gridTexture} transparent opacity={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[Math.min(halfW, halfD) * 0.9, Math.min(halfW, halfD) * 0.9 + 0.06, 96]} />
        <meshBasicMaterial color={'#00D4FF'} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {structure?.aisles.map((a) => {
        const cx = (a.from.x + a.to.x) / 2;
        const cz = (a.from.z + a.to.z) / 2;
        const len = Math.hypot(a.to.x - a.from.x, a.to.z - a.from.z);
        const angle = Math.atan2(a.to.z - a.from.z, a.to.x - a.from.x);
        return (
          <mesh
            key={a.id}
            rotation={[-Math.PI / 2, 0, -angle]}
            position={[cx, 0.003, cz]}
          >
            <planeGeometry args={[len, a.width * 0.85]} />
            <meshBasicMaterial color={'#00D4FF'} transparent opacity={0.07} />
          </mesh>
        );
      })}

      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, depth)]} />
        <lineBasicMaterial color={'#00D4FF'} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
