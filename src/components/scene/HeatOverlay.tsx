import { useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

function heatColor(value: number): THREE.Color {
  const stops: [number, [number, number, number]][] = [
    [0.0, [0, 0.25, 0.7]],
    [0.3, [0, 0.7, 0.95]],
    [0.55, [0, 0.95, 0.55]],
    [0.8, [1, 0.8, 0.15]],
    [1.0, [1, 0.25, 0.35]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t1, c1] = stops[i];
    const [t2, c2] = stops[i + 1];
    if (value <= t2) {
      const k = (value - t1) / (t2 - t1);
      return new THREE.Color(
        c1[0] + (c2[0] - c1[0]) * k,
        c1[1] + (c2[1] - c1[1]) * k,
        c1[2] + (c2[2] - c1[2]) * k
      );
    }
  }
  return new THREE.Color(1, 0.25, 0.35);
}

export function HeatOverlay() {
  const { layers, heatGrid, heatOpacity, heatMode, structure } = useAppStore();

  const cells = useMemo(() => heatGrid?.cells ?? [], [heatGrid]);

  const instances = useMemo(() => {
    if (!heatGrid || !structure) return null;
    const count = cells.length;
    if (count === 0) return null;
    const halfW = structure.groundSize.width / 2;
    const halfD = structure.groundSize.depth / 2;
    const cellSize = heatGrid.cellSize;
    const mesh = new THREE.InstancedMesh(
      heatMode === 'volumetric'
        ? new THREE.BoxGeometry(cellSize * 0.92, 1, cellSize * 0.92)
        : new THREE.PlaneGeometry(cellSize * 0.94, cellSize * 0.94),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: heatOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      count
    );
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let idx = 0;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const x = -halfW + (cell.col + 0.5) * cellSize;
      const z = -halfD + (cell.row + 0.5) * cellSize;
      const v = cell.value;
      if (heatMode === 'volumetric') {
        const h = 0.03 + Math.pow(v, 1.4) * 3.2;
        dummy.position.set(x, h / 2 + 0.02, z);
        dummy.scale.set(1, h, 1);
      } else {
        dummy.position.set(x, 0.04, z);
        dummy.rotation.x = -Math.PI / 2;
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      const c = heatColor(v);
      color.copy(c);
      mesh.setColorAt(idx, color);
      idx++;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }, [heatGrid, structure, cells, heatMode, heatOpacity]);

  if (!layers.heat || !heatGrid || !structure) return null;

  return (
    <group>
      <primitive object={instances!} />
      <LegendBar />
    </group>
  );
}

function LegendBar() {
  const { structure, heatOpacity } = useAppStore();
  if (!structure) return null;
  const halfW = structure.groundSize.width / 2;
  const steps = 8;
  return (
    <group position={[-halfW - 1.5, 0.1, -structure.groundSize.depth / 2 + 4]}>
      {Array.from({ length: steps }).map((_, i) => {
        const v = i / (steps - 1);
        const c = heatColor(v);
        return (
          <mesh key={i} position={[0, 0, i * 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.35, 0.3]} />
            <meshBasicMaterial color={c} transparent opacity={heatOpacity} />
          </mesh>
        );
      })}
    </group>
  );
}
