import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { Html } from '@react-three/drei';
import type { PickTask, TrajectoryPoint } from '@/types';
import { STRATEGY_COLORS } from '@/types';

function getPositionAt(task: PickTask, progress: number): { pos: THREE.Vector3; t: number; nodeIdx: number } {
  const totalDur = task.totalDuration || 1;
  const targetT = progress * totalDur;
  const pts = task.points;
  if (pts.length < 2) return { pos: new THREE.Vector3(pts[0]?.x ?? 0, 0.2, pts[0]?.z ?? 0), t: targetT, nodeIdx: 0 };

  let idx = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i + 1].t >= targetT) {
      idx = i;
      break;
    }
    if (i === pts.length - 2) idx = i;
  }
  const a = pts[idx];
  const b = pts[idx + 1] || a;
  const span = Math.max(0.001, b.t - a.t);
  const k = Math.max(0, Math.min(1, (targetT - a.t) / span));
  const pos = new THREE.Vector3(
    a.x + (b.x - a.x) * k,
    0.25,
    a.z + (b.z - a.z) * k
  );

  let nodeIdx = 0;
  for (let i = 0; i < task.nodes.length; i++) {
    if (task.nodes[i].arriveAt <= targetT) nodeIdx = i;
  }
  return { pos, t: targetT, nodeIdx };
}

function PickerAgent({
  task,
  progress,
  color,
  alwaysShowLabel,
}: {
  task: PickTask;
  progress: number;
  color: string;
  alwaysShowLabel?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const info = useMemo(() => getPositionAt(task, progress), [task, progress]);
  const [showDetail, setShowDetail] = useState(false);

  const currentNode = task.nodes[info.nodeIdx];
  const atNode = currentNode && info.t >= currentNode.arriveAt && info.t <= currentNode.leaveAt;

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.position.lerp(info.pos, Math.min(1, dt * 12));
    }
  });

  return (
    <group
      ref={ref}
      position={info.pos}
      onPointerOver={() => setShowDetail(true)}
      onPointerOut={() => setShowDetail(false)}
    >
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.35, 6, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={'#f5d5b8'} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color={color} intensity={atNode ? 1.2 : 0.6} distance={3.5} decay={2} />

      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={9}
        style={{ pointerEvents: 'none', transition: 'opacity 200ms' }}
      >
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-mono-num whitespace-nowrap border ${
            showDetail || alwaysShowLabel
              ? 'opacity-100 bg-space-900/90 border-steel-cyan/40 text-white shadow-glow-sm'
              : 'opacity-70 bg-space-800/80 border-white/10 text-slate-200'
          }`}
          style={{ borderColor: `${color}66` }}
        >
          <div className="font-semibold" style={{ color }}>
            {task.pickerName} · {task.taskId.slice(-4)}
          </div>
          {showDetail && (
            <div className="text-[9px] text-slate-400 mt-0.5">
              {currentNode ? `货位 ${currentNode.slotCode} · 停留 ${Math.round(currentNode.dwellTime)}s` : '移动中...'}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function PlaybackTicker() {
  const { isPlaying, playbackSpeed, playbackProgress, setPlaybackProgress, selectedTaskId, tasks } = useAppStore();

  useFrame((_, dt) => {
    if (!isPlaying || !selectedTaskId) return;
    const task = tasks.find((t) => t.taskId === selectedTaskId);
    if (!task) return;
    const totalDur = task.totalDuration || 1;
    const step = (dt * playbackSpeed * 8) / totalDur;
    const next = playbackProgress + step;
    if (next >= 1) {
      setPlaybackProgress(1);
    } else {
      setPlaybackProgress(next);
    }
  });
  return null;
}

export function PlaybackAgents() {
  const { layers, tasks, selectedTaskId, playbackProgress, highlightedTaskIds, isPlaying } = useAppStore();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const activeTasks = useMemo(() => {
    if (!layers.pickers) return [] as PickTask[];
    if (selectedTaskId) {
      const t = tasks.find((x) => x.taskId === selectedTaskId);
      return t ? [t] : [];
    }
    if (highlightedTaskIds.length > 0) {
      return tasks.filter((t) => highlightedTaskIds.includes(t.taskId)).slice(0, 12);
    }
    if (!isPlaying) return tasks.slice(0, 10);
    return tasks.slice(0, 8);
  }, [layers.pickers, tasks, selectedTaskId, highlightedTaskIds, isPlaying]);

  return (
    <group>
      <PlaybackTicker />
      {activeTasks.map((task, i) => {
        const p = selectedTaskId === task.taskId ? playbackProgress : (i * 0.08 + playbackProgress * 0.35 + i * 0.03) % 1;
        return (
          <PickerAgent
            key={task.taskId}
            task={task}
            progress={p}
            color={STRATEGY_COLORS[task.strategy] ?? '#00D4FF'}
            alwaysShowLabel={selectedTaskId === task.taskId}
          />
        );
      })}
    </group>
  );
}

export type { TrajectoryPoint };
