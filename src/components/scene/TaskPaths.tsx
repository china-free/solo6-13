import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { STRATEGY_COLORS } from '@/types';
import { Html } from '@react-three/drei';
import type { PickTask } from '@/types';

const MAX_DISPLAY_PATHS = 80;

function PathTube({
  task,
  color,
  isSelected,
  isHighlighted,
  onClick,
  hovered,
  onHover,
}: {
  task: PickTask;
  color: string;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: (id: string) => void;
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const tube = useMemo(() => {
    if (task.points.length < 2) return null;
    const pts = task.points.map(
      (p) => new THREE.Vector3(p.x, 0.06 + Math.random() * 0.02, p.z)
    );
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.15);
    const segments = Math.max(40, Math.min(120, pts.length * 3));
    const geometry = new THREE.TubeGeometry(curve, segments, 0.055, 8, false);
    return { geometry, curve };
  }, [task]);

  if (!tube) return null;

  const active = isSelected || isHighlighted;
  const dim = !active && hovered && hovered !== task.taskId;
  const opacity = active ? 0.95 : dim ? 0.08 : 0.32;
  const radius = active ? 0.09 : 0.055;
  const emissiveIntensity = active ? 1.4 : 0.4;

  return (
    <group>
      <mesh
        geometry={tube.geometry}
        scale={[1, radius / 0.055, 1]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(task.taskId);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(task.taskId);
        }}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {active && (
        <mesh geometry={tube.geometry} scale={[1, (radius * 1.8) / 0.055, 1]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {task.points.length > 0 && (
        <mesh position={[task.points[0].x, 0.2, task.points[0].z]}>
          <sphereGeometry args={[active ? 0.16 : 0.1, 16, 16]} />
          <meshBasicMaterial color={'#00FF94'} transparent opacity={opacity} />
        </mesh>
      )}
      {task.points.length > 1 && (
        <mesh position={[task.points[task.points.length - 1].x, 0.2, task.points[task.points.length - 1].z]}>
          <sphereGeometry args={[active ? 0.16 : 0.1, 16, 16]} />
          <meshBasicMaterial color={'#FF4D6D'} transparent opacity={opacity} />
        </mesh>
      )}

      {active &&
        task.nodes.map((n, i) => {
          const p = task.points.find((pt) => Math.abs(pt.t - n.arriveAt) < 0.5) || task.points[0];
          return (
            <group key={n.nodeId} position={[p.x, 0.25, p.z]}>
              <mesh>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial color={'#FFC93C'} transparent opacity={0.85} />
              </mesh>
              <Html
                position={[0, 0.45, 0]}
                center
                distanceFactor={10}
                style={{ pointerEvents: 'none' }}
              >
                <div className="tooltip-bubble px-1.5 py-0.5 rounded text-[10px] font-mono-num whitespace-nowrap text-steel-yellow">
                  #{i + 1} · {n.slotCode} · {Math.round(n.dwellTime)}s
                </div>
              </Html>
            </group>
          );
        })}
    </group>
  );
}

export function TaskPaths() {
  const { layers, tasks, selectedTaskId, highlightedTaskIds, selectTask } = useAppStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const displayedTasks = useMemo(() => {
    if (!layers.paths) return [];
    if (selectedTaskId) {
      const sel = tasks.find((t) => t.taskId === selectedTaskId);
      return sel ? [sel] : [];
    }
    if (highlightedTaskIds.length > 0) {
      return tasks.filter((t) => highlightedTaskIds.includes(t.taskId));
    }
    return tasks.length > MAX_DISPLAY_PATHS ? tasks.slice(0, MAX_DISPLAY_PATHS) : tasks;
  }, [layers.paths, tasks, selectedTaskId, highlightedTaskIds]);

  if (!layers.paths) return null;

  return (
    <group>
      {displayedTasks.map((task) => (
        <PathTube
          key={task.taskId}
          task={task}
          color={STRATEGY_COLORS[task.strategy] ?? '#00D4FF'}
          isSelected={selectedTaskId === task.taskId}
          isHighlighted={highlightedTaskIds.includes(task.taskId)}
          onClick={selectTask}
          hovered={hovered}
          onHover={setHovered}
        />
      ))}
    </group>
  );
}
