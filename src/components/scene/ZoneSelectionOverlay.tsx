import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { X } from 'lucide-react';

export function ZoneSelectionOverlay() {
  const structure = useAppStore((s) => s.structure);
  const drillDownZoneId = useAppStore((s) => s.drillDownZoneId);
  const setDrillDownZoneId = useAppStore((s) => s.setDrillDownZoneId);
  const pulseRef = useRef(0);

  useFrame((_, dt) => {
    pulseRef.current += dt * 2;
  });

  const selectedZone = useMemo(() => {
    if (!structure || !drillDownZoneId) return null;
    return structure.zones.find((z) => z.id === drillDownZoneId) || null;
  }, [structure, drillDownZoneId]);

  if (!structure || !selectedZone) return null;

  const pulse = 0.5 + 0.5 * Math.sin(pulseRef.current);
  const { bounds, color, name, id } = selectedZone;
  const cx = bounds.x + bounds.w / 2;
  const cz = bounds.z + bounds.d / 2;

  const tasksInZone = useAppStore
    .getState()
    .tasks.filter((t) => t.nodes.some((n) => {
      const rack = structure.racks.find((r) => r.id === n.rackId);
      return rack?.zoneId === id;
    }));

  const taskCount = tasksInZone.length;
  const passCount = tasksInZone.reduce((sum, t) => sum + t.nodes.filter((n) => {
    const r = structure.racks.find((x) => x.id === n.rackId);
    return r?.zoneId === id;
  }).length, 0);

  return (
    <group>
      <mesh position={[cx, 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bounds.w + 0.2, bounds.d + 0.2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08 + pulse * 0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[cx, 0.07, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(bounds.w, bounds.d) / 2 - 0.05, Math.min(bounds.w, bounds.d) / 2, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.3 + pulse * 0.3} side={THREE.DoubleSide} />
      </mesh>

      <group position={[cx, 0.1, cz]}>
        {[
          [bounds.w / 2, bounds.d / 2],
          [bounds.w / 2, -bounds.d / 2],
          [-bounds.w / 2, -bounds.d / 2],
          [-bounds.w / 2, bounds.d / 2],
        ].map((p, i) => {
          const next = [(i + 1) % 4][0] as number;
          const points = [
            new THREE.Vector3(p[0], 0, p[1]),
            new THREE.Vector3(
              [[bounds.w / 2, bounds.d / 2], [bounds.w / 2, -bounds.d / 2], [-bounds.w / 2, -bounds.d / 2], [-bounds.w / 2, bounds.d / 2]][next][0],
              0,
              [[bounds.w / 2, bounds.d / 2], [bounds.w / 2, -bounds.d / 2], [-bounds.w / 2, -bounds.d / 2], [-bounds.w / 2, bounds.d / 2]][next][1]
            ),
          ];
          const geom = new THREE.BufferGeometry().setFromPoints(points);
          return (
            <lineSegments key={i}>
              <primitive object={geom} attach="geometry" />
              <lineBasicMaterial color={color} transparent opacity={0.6 + pulse * 0.4} />
            </lineSegments>
          );
        })}
      </group>

      <mesh position={[cx, 0.1, cz]}>
        <boxGeometry args={[bounds.w + 0.3, 0.01, bounds.d + 0.3]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.04 + pulse * 0.03}
        />
      </mesh>

      <Html position={[cx, 0.5, cz]} center distanceFactor={10} zIndexRange={[100, 0]}>
        <div
          className="panel rounded-lg px-3 py-2 min-w-[150px] pointer-events-auto animate-[pulse_2s_ease-in-out_infinite]"
          style={{ borderColor: `${color}66`, boxShadow: `0 0 20px ${color}22` }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
              />
              <span className="text-xs font-bold tracking-wide" style={{ color }}>
                {name}
              </span>
            </div>
            <button
              className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setDrillDownZoneId(null);
              }}
              title="取消区域下钻"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono-num">
            <div className="text-slate-500">任务数</div>
            <div className="text-right text-slate-200">{taskCount}</div>
            <div className="text-slate-500">节点访问</div>
            <div className="text-right text-slate-200">{passCount}</div>
          </div>
        </div>
      </Html>
    </group>
  );
}
