export type StrategyType = 'S_SHAPED' | 'ZONED_RELAY' | 'WAVE_PICKING' | 'ALL';
export type ShiftType = 'morning' | 'afternoon' | 'night';
export type ShiftFilter = ShiftType | 'all';

export interface TimeRangeParams {
  startTime: string;
  endTime: string;
  shift?: ShiftFilter;
  strategies?: StrategyType[];
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  bounds: { x: number; z: number; w: number; d: number };
}

export interface Rack {
  id: string;
  zoneId: string;
  position: { x: number; y: number; z: number };
  size: { w: number; h: number; d: number };
  levels: number;
  slotsPerLevel: number;
}

export interface Aisle {
  id: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  width: number;
}

export interface WarehouseStructure {
  zones: Zone[];
  racks: Rack[];
  aisles: Aisle[];
  groundSize: { width: number; depth: number };
}

export interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
  z: number;
}

export interface TaskNode {
  nodeId: string;
  rackId: string;
  slotCode: string;
  arriveAt: number;
  leaveAt: number;
  dwellTime: number;
  skuQty: number;
}

export interface PickTask {
  taskId: string;
  orderNo: string;
  pickerId: string;
  pickerName: string;
  strategy: StrategyType;
  shift: ShiftType;
  startTime: string;
  endTime: string;
  totalDistance: number;
  totalDuration: number;
  skuCount: number;
  points: TrajectoryPoint[];
  nodes: TaskNode[];
}

export interface KPIData {
  totalTasks: number;
  avgDistance: number;
  avgDuration: number;
  congestionIndex: number;
  comparePrevious: {
    totalTasks: number;
    avgDistance: number;
    avgDuration: number;
    congestionIndex: number;
  };
}

export interface CongestionZone {
  zoneId: string;
  zoneName: string;
  passCount: number;
  avgDwellTime: number;
  suggestion: string;
}

export interface StrategyCompare {
  strategy: StrategyType;
  taskCount: number;
  avgDistance: number;
  avgDuration: number;
  revisitRate: number;
}

export interface HeatCell {
  col: number;
  row: number;
  value: number;
  passCount: number;
  totalDwell: number;
}

export interface HeatGrid {
  cellSize: number;
  cols: number;
  rows: number;
  cells: HeatCell[];
}

export interface WarehouseAPI {
  getStructure(): Promise<WarehouseStructure>;
  getTasks(params: TimeRangeParams): Promise<PickTask[]>;
  getKPIs(params: TimeRangeParams): Promise<KPIData>;
  getCongestionZones(params: TimeRangeParams, topN?: number): Promise<CongestionZone[]>;
  getStrategyCompare(params: TimeRangeParams): Promise<StrategyCompare[]>;
  getHeatGrid(params: TimeRangeParams, cellSize?: number): Promise<HeatGrid>;
}

export type HeatMode = 'planar' | 'volumetric';

export interface LayersState {
  warehouse: boolean;
  rackLabels: boolean;
  paths: boolean;
  heat: boolean;
  pickers: boolean;
}

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  S_SHAPED: 'S型拣货',
  ZONED_RELAY: '分区接力',
  WAVE_PICKING: '波浪拣货',
  ALL: '全部策略',
};

export const STRATEGY_COLORS: Record<StrategyType, string> = {
  S_SHAPED: '#00FF94',
  ZONED_RELAY: '#00D4FF',
  WAVE_PICKING: '#B794F4',
  ALL: '#FFC93C',
};

export const SHIFT_LABELS: Record<ShiftFilter, string> = {
  morning: '早班 06-14',
  afternoon: '中班 14-22',
  night: '晚班 22-06',
  all: '全部班次',
};
