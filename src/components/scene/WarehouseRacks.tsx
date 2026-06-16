import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { Html } from '@react-three/drei';
import type { Rack } from '@/types';

function RackMesh({
  rack,
  zoneColor,
  onHover,
  onClick,
  showLabel,
  isHighlighted,
}: {
  rack: Rack;
  zoneColor: string;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  showLabel: boolean;
  isHighlighted: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const color = hovered || isHighlighted ? zoneColor : '#1a2a44';
  const edgeColor = isHighlighted ? zoneColor : hovered ? zoneColor : '#2d4872';

  const levelPositions = useMemo(() => {
    const arr: number[] = [];
    const step = rack.size.h / rack.levels;
    for (let i = 1; i < rack.levels; i++) arr.push(-rack.size.h / 2 + i * step);
    return arr;
  }, [rack.size.h, rack.levels]);

  return (
    <group
      position={[rack.position.x, rack.position.y, rack.position.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(rack.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(rack.id);
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[rack.size.w, rack.size.h, rack.size.d]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.55}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(rack.size.w + 0.004, rack.size.h + 0.004, rack.size.d + 0.004)]} />
        <lineBasicMaterial color={edgeColor} transparent opacity={hovered || isHighlighted ? 1 : 0.55} />
      </lineSegments>

      {levelPositions.map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[rack.size.w * 0.95, 0.03, rack.size.d * 0.95]} />
          <meshStandardMaterial color={zoneColor} transparent opacity={0.35} metalness={0.3} roughness={0.4} emissive={zoneColor} emissiveIntensity={0.08} />
        </mesh>
      ))}

      <mesh position={[0, rack.size.h / 2 + 0.02, 0]}>
        <boxGeometry args={[rack.size.w * 0.92, 0.04, rack.size.d * 0.9]} />
        <meshBasicMaterial color={zoneColor} transparent opacity={hovered || isHighlighted ? 0.55 : 0.25} />
      </mesh>

      {showLabel && (
        <Html
          position={[0, rack.size.h / 2 + 0.5, 0]}
          center
          distanceFactor={18}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`px-2 py-0.5 text-[10px] font-mono-num whitespace-nowrap rounded border transition-all ${
              hovered
                ? 'bg-steel-cyan/20 border-steel-cyan/60 text-steel-cyan shadow-glow-sm'
                : 'bg-space-900/70 border-white/10 text-slate-300'
            }`}
          >
            {rack.id}
          </div>
        </Html>
      )}
    </group>
  );
}

export function WarehouseRacks() {
  const { structure, layers, tasks, selectedTaskId } = useAppStore();
  const [, setHovered] = useState<string | null>(null);

  const zoneColorMap = useMemo(() => {
    const m = new Map<string, string>();
    structure?.zones.forEach((z) => m.set(z.id, z.color));
    return m;
  }, [structure]);

  const highlightedRackIds = useMemo(() => {
    const set = new Set<string>();
    if (selectedTaskId) {
      const t = tasks.find((x) => x.taskId === selectedTaskId);
      t?.nodes.forEach((n) => set.add(n.rackId));
    }
    return set;
  }, [selectedTaskId, tasks]);

  if (!structure || !layers.warehouse) return null;

  return (
    <group>
      {structure.racks.map((rack) => (
        <RackMesh
          key={rack.id}
          rack={rack}
          zoneColor={zoneColorMap.get(rack.zoneId) ?? '#00D4FF'}
          onHover={setHovered}
          onClick={() => {}}
          showLabel={layers.rackLabels}
          isHighlighted={highlightedRackIds.has(rack.id)}
        />
      ))}
    </group>
  );
}
