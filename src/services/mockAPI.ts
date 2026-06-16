import type {
  WarehouseStructure,
  Zone,
  Rack,
  Aisle,
  PickTask,
  TrajectoryPoint,
  TaskNode,
  KPIData,
  CongestionZone,
  StrategyCompare,
  HeatGrid,
  HeatCell,
  TimeRangeParams,
  StrategyType,
  ShiftType,
  ShiftFilter,
} from '@/types';

const GROUND_W = 30;
const GROUND_D = 20;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(42);

function buildStructure(): WarehouseStructure {
  const zones: Zone[] = [
    { id: 'A', name: 'A区-快消', color: '#00D4FF', bounds: { x: -14, z: -9, w: 13, d: 8 } },
    { id: 'B', name: 'B区-电子', color: '#00FF94', bounds: { x: 1, z: -9, w: 13, d: 8 } },
    { id: 'C', name: 'C区-日用品', color: '#FFC93C', bounds: { x: -14, z: 1, w: 13, d: 8 } },
    { id: 'D', name: 'D区-家电', color: '#B794F4', bounds: { x: 1, z: 1, w: 13, d: 8 } },
  ];

  const racks: Rack[] = [];
  const aisles: Aisle[] = [];
  const rackW = 1.8;
  const rackD = 0.8;
  const rackH = 4;

  zones.forEach((zone) => {
    const rows = 3;
    const cols = 4;
    const startX = zone.bounds.x + 1;
    const startZ = zone.bounds.z + 1;
    const spacingX = 3;
    const spacingZ = 2.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        racks.push({
          id: `${zone.id}-${r + 1}-${c + 1}`,
          zoneId: zone.id,
          position: {
            x: startX + c * spacingX,
            y: rackH / 2,
            z: startZ + r * spacingZ,
          },
          size: { w: rackW, h: rackH, d: rackD },
          levels: 4,
          slotsPerLevel: 6,
        });
      }
    }
  });

  for (let i = -12; i <= 12; i += 6) {
    aisles.push({
      id: `aisle-x-${i}`,
      from: { x: i, z: -9.5 },
      to: { x: i, z: 9.5 },
      width: 2,
    });
  }
  for (let i = -6; i <= 6; i += 6) {
    aisles.push({
      id: `aisle-z-${i}`,
      from: { x: -14.5, z: i },
      to: { x: 14.5, z: i },
      width: 2,
    });
  }

  return {
    zones,
    racks,
    aisles,
    groundSize: { width: GROUND_W, depth: GROUND_D },
  };
}

function pickRandom<T>(arr: T[], r = rand): T {
  return arr[Math.floor(r() * arr.length)];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function buildTrajectory(
  racks: Rack[],
  strategy: StrategyType,
  shift: ShiftType,
  idx: number
): { points: TrajectoryPoint[]; nodes: TaskNode[]; distance: number; duration: number } {
  const r = seededRandom(1000 + idx * 13 + shift.length);
  const nodeCount = 4 + Math.floor(r() * 5);
  const chosenRacks: Rack[] = [];
  const used = new Set<string>();
  while (chosenRacks.length < nodeCount && used.size < racks.length) {
    const rack = pickRandom(racks, r);
    if (!used.has(rack.id)) {
      used.add(rack.id);
      chosenRacks.push(rack);
    }
  }

  if (strategy === 'S_SHAPED') {
    chosenRacks.sort((a, b) => a.position.z - b.position.z || a.position.x - b.position.x);
  } else if (strategy === 'WAVE_PICKING') {
    chosenRacks.sort((a, b) => a.position.x - b.position.x);
  }

  const start = { x: 0, y: 0, z: GROUND_D / 2 + 1 };
  const points: TrajectoryPoint[] = [];
  const nodes: TaskNode[] = [];
  let t = 0;
  let distance = 0;
  let prev = start;

  points.push({ t, x: prev.x, y: 0, z: prev.z });

  const appendPath = (target: { x: number; y: number; z: number }) => {
    const dx = target.x - prev.x;
    const dz = target.z - prev.z;
    const segDist = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.max(3, Math.floor(segDist / 0.5));
    for (let s = 1; s <= steps; s++) {
      const k = s / steps;
      const x = prev.x + dx * k + (r() - 0.5) * 0.08;
      const z = prev.z + dz * k + (r() - 0.5) * 0.08;
      t += (segDist / 1.2) / steps;
      points.push({ t, x, y: 0, z });
    }
    distance += segDist;
    prev = target;
  };

  chosenRacks.forEach((rack, i) => {
    const targetX = rack.position.x + rack.size.w / 2 + 0.3;
    const targetZ = rack.position.z;
    appendPath({ x: targetX, y: 0, z: targetZ });

    const dwell = 10 + r() * 30;
    const arriveAt = t;
    t += dwell;
    const leaveAt = t;
    const qty = 1 + Math.floor(r() * 3);

    nodes.push({
      nodeId: `node-${idx}-${i}`,
      rackId: rack.id,
      slotCode: `${rack.id}-${1 + Math.floor(r() * rack.levels)}-${1 + Math.floor(r() * rack.slotsPerLevel)}`,
      arriveAt,
      leaveAt,
      dwellTime: dwell,
      skuQty: qty,
    });

    const bubbleSteps = 3;
    for (let b = 1; b <= bubbleSteps; b++) {
      points.push({ t: arriveAt + (dwell * b) / bubbleSteps, x: targetX, y: 0, z: targetZ });
    }
  });

  const end = { x: 0, y: 0, z: GROUND_D / 2 + 1 };
  appendPath(end);

  return { points, nodes, distance, duration: t };
}

function buildTasks(structure: WarehouseStructure, count = 200): PickTask[] {
  const tasks: PickTask[] = [];
  const strategies: StrategyType[] = ['S_SHAPED', 'ZONED_RELAY', 'WAVE_PICKING'];
  const shifts: ShiftType[] = ['morning', 'afternoon', 'night'];
  const strategyWeights = [0.4, 0.35, 0.25];
  const pickerNames = ['张伟', '李娜', '王磊', '刘洋', '陈静', '杨帆', '赵磊', '黄琳', '周浩', '吴敏'];

  for (let i = 0; i < count; i++) {
    const r = seededRandom(5000 + i * 7);
    const rv = r();
    let strategy: StrategyType = 'S_SHAPED';
    let acc = 0;
    for (let s = 0; s < strategies.length; s++) {
      acc += strategyWeights[s];
      if (rv < acc) {
        strategy = strategies[s];
        break;
      }
    }
    const shift = shifts[Math.floor(r() * shifts.length)];
    const baseDate = new Date('2026-06-16T00:00:00');
    const shiftStartHour = shift === 'morning' ? 6 : shift === 'afternoon' ? 14 : 22;
    const startOffset = shiftStartHour * 3600 + Math.floor(r() * 7 * 3600);
    const startTime = new Date(baseDate.getTime() + startOffset * 1000);

    const { points, nodes, distance, duration } = buildTrajectory(structure.racks, strategy, shift, i);
    const endTime = new Date(startTime.getTime() + duration * 1000);

    tasks.push({
      taskId: `TASK-${String(10000 + i)}`,
      orderNo: `ORD-${String(20260616000 + i)}`,
      pickerId: `P${String(101 + (i % pickerNames.length))}`,
      pickerName: pickerNames[i % pickerNames.length],
      strategy,
      shift,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDistance: Math.round(distance * 100) / 100,
      totalDuration: Math.round(duration),
      skuCount: nodes.reduce((a, n) => a + n.skuQty, 0),
      points,
      nodes,
    });
  }

  return tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function filterTasks<T extends { startTime: string; endTime: string; shift: ShiftType; strategy: StrategyType }>(
  tasks: T[],
  params: TimeRangeParams
): T[] {
  const start = new Date(params.startTime).getTime();
  const end = new Date(params.endTime).getTime();
  return tasks.filter((t) => {
    const ts = new Date(t.startTime).getTime();
    const te = new Date(t.endTime).getTime();
    if (te < start || ts > end) return false;
    if (params.shift && params.shift !== 'all' && t.shift !== params.shift) return false;
    if (params.strategies && params.strategies.length > 0 && !params.strategies.includes(t.strategy)) return false;
    return true;
  });
}

function computeKPIs(tasks: PickTask[]): KPIData {
  if (tasks.length === 0) {
    return {
      totalTasks: 0,
      avgDistance: 0,
      avgDuration: 0,
      congestionIndex: 0,
      comparePrevious: { totalTasks: 0, avgDistance: 0, avgDuration: 0, congestionIndex: 0 },
    };
  }
  const totalTasks = tasks.length;
  const avgDistance = tasks.reduce((a, t) => a + t.totalDistance, 0) / totalTasks;
  const avgDuration = tasks.reduce((a, t) => a + t.totalDuration, 0) / totalTasks;

  const zonePass = new Map<string, { count: number; dwell: number }>();
  tasks.forEach((t) =>
    t.nodes.forEach((n) => {
      const zid = n.rackId.charAt(0);
      const cur = zonePass.get(zid) || { count: 0, dwell: 0 };
      cur.count++;
      cur.dwell += n.dwellTime;
      zonePass.set(zid, cur);
    })
  );
  let congestionSum = 0;
  zonePass.forEach((v) => {
    congestionSum += v.count * (v.dwell / Math.max(1, v.count));
  });
  const maxPossible = tasks.length * 8 * 25;
  const congestionIndex = clamp(Math.round((congestionSum / maxPossible) * 100), 0, 100);

  const r = seededRandom(999 + tasks.length);
  const vary = () => (r() - 0.5) * 30;

  return {
    totalTasks,
    avgDistance: Math.round(avgDistance * 10) / 10,
    avgDuration: Math.round(avgDuration),
    congestionIndex,
    comparePrevious: {
      totalTasks: Math.round(vary()),
      avgDistance: Math.round(vary()) / 10,
      avgDuration: Math.round(vary() / 5),
      congestionIndex: Math.round(vary() / 3),
    },
  };
}

function computeCongestion(tasks: PickTask[], structure: WarehouseStructure, topN = 5): CongestionZone[] {
  const suggestions = [
    '建议增加补货频次，避免高峰断货',
    '建议将高频SKU调整至出入口附近',
    '建议增派拣货员，分流通道压力',
    '建议优化拣货顺序，减少回头路径',
    '建议扩宽通道或增设临时货位',
  ];
  const result: CongestionZone[] = structure.zones.map((zone) => {
    let passCount = 0;
    let dwellSum = 0;
    tasks.forEach((t) =>
      t.nodes.forEach((n) => {
        if (n.rackId.startsWith(zone.id)) {
          passCount++;
          dwellSum += n.dwellTime;
        }
      })
    );
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      passCount,
      avgDwellTime: passCount ? Math.round(dwellSum / passCount) : 0,
      suggestion: suggestions[(zone.id.charCodeAt(0) + passCount) % suggestions.length],
    };
  });
  result.sort((a, b) => b.passCount * b.avgDwellTime - a.passCount * a.avgDwellTime);
  return result.slice(0, topN);
}

function computeStrategyCompare(tasks: PickTask[]): StrategyCompare[] {
  const groups = new Map<StrategyType, PickTask[]>();
  tasks.forEach((t) => {
    const arr = groups.get(t.strategy) || [];
    arr.push(t);
    groups.set(t.strategy, arr);
  });
  const result: StrategyCompare[] = [];
  groups.forEach((arr, strategy) => {
    const count = arr.length;
    const avgDist = arr.reduce((a, t) => a + t.totalDistance, 0) / count;
    const avgDur = arr.reduce((a, t) => a + t.totalDuration, 0) / count;
    let revisits = 0;
    arr.forEach((t) => {
      const seen = new Set<string>();
      t.nodes.forEach((n) => {
        const prefix = n.rackId;
        if (seen.has(prefix)) revisits++;
        seen.add(prefix);
      });
    });
    const revisitRate = Math.round((revisits / Math.max(1, arr.reduce((a, t) => a + t.nodes.length, 0))) * 1000) / 10;
    result.push({
      strategy,
      taskCount: count,
      avgDistance: Math.round(avgDist * 10) / 10,
      avgDuration: Math.round(avgDur),
      revisitRate,
    });
  });
  return result;
}

function computeHeatGrid(tasks: PickTask[], cellSize = 1): HeatGrid {
  const cols = Math.ceil(GROUND_W / cellSize);
  const rows = Math.ceil(GROUND_D / cellSize);
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const passGrid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const dwellGrid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  let maxV = 0;
  tasks.forEach((t) => {
    t.points.forEach((p, i) => {
      const col = Math.floor((p.x + GROUND_W / 2) / cellSize);
      const row = Math.floor((p.z + GROUND_D / 2) / cellSize);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        let weight = 1;
        if (i > 0 && i < t.points.length - 1) {
          const prev = t.points[i - 1];
          const next = t.points[i + 1];
          if (Math.abs(prev.x - p.x) < 0.01 && Math.abs(prev.z - p.z) < 0.01 && Math.abs(next.x - p.x) < 0.01 && Math.abs(next.z - p.z) < 0.01) {
            weight = 4;
          }
        }
        grid[row][col] += weight;
        passGrid[row][col] += 1;
        dwellGrid[row][col] += weight * 0.5;
        if (grid[row][col] > maxV) maxV = grid[row][col];
      }
    });
  });

  const cells: HeatCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] > 0) {
        cells.push({
          col: c,
          row: r,
          value: maxV > 0 ? Math.min(1, grid[r][c] / maxV) : 0,
          passCount: passGrid[r][c],
          totalDwell: Math.round(dwellGrid[r][c] * 10) / 10,
        });
      }
    }
  }

  return { cellSize, cols, rows, cells };
}

const STRUCTURE = buildStructure();
const ALL_TASKS = buildTasks(STRUCTURE, 200);

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(v), ms));
}

export const mockAPI = {
  getStructure: () => delay({ ...STRUCTURE }),
  getTasks: (params: TimeRangeParams) => delay(filterTasks(ALL_TASKS, params).map((t) => ({ ...t }))),
  getKPIs: (params: TimeRangeParams) => delay(computeKPIs(filterTasks(ALL_TASKS, params))),
  getCongestionZones: (params: TimeRangeParams, topN = 5) =>
    delay(computeCongestion(filterTasks(ALL_TASKS, params), STRUCTURE, topN)),
  getStrategyCompare: (params: TimeRangeParams) => delay(computeStrategyCompare(filterTasks(ALL_TASKS, params))),
  getHeatGrid: (params: TimeRangeParams, cellSize = 1) =>
    delay(computeHeatGrid(filterTasks(ALL_TASKS, params), cellSize)),
};
