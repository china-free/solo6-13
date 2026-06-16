import { create } from 'zustand';
import type {
  WarehouseStructure,
  PickTask,
  KPIData,
  CongestionZone,
  StrategyCompare,
  HeatGrid,
  StrategyType,
  ShiftFilter,
  LayersState,
  HeatMode,
} from '@/types';
import { mockAPI } from '@/services/mockAPI';

function getDefaultTimeRange() {
  const start = new Date('2026-06-16T06:00:00');
  const end = new Date('2026-06-16T22:00:00');
  return { start: start.toISOString(), end: end.toISOString() };
}

interface AppState {
  timeRange: { start: string; end: string };
  shift: ShiftFilter;
  selectedStrategies: StrategyType[];

  layers: LayersState;
  heatOpacity: number;
  heatMode: HeatMode;

  isPlaying: boolean;
  playbackSpeed: 0.5 | 1 | 2 | 4;
  playbackProgress: number;
  selectedTaskId: string | null;
  highlightedTaskIds: string[];

  structure: WarehouseStructure | null;
  tasks: PickTask[];
  kpis: KPIData | null;
  congestionZones: CongestionZone[];
  strategyCompare: StrategyCompare[];
  heatGrid: HeatGrid | null;
  loading: boolean;
  error: string | null;

  setTimeRange: (start: string, end: string) => void;
  setShift: (s: ShiftFilter) => void;
  toggleStrategy: (s: StrategyType) => void;
  setSelectedStrategies: (arr: StrategyType[]) => void;

  toggleLayer: (key: keyof LayersState) => void;
  setHeatOpacity: (v: number) => void;
  setHeatMode: (m: HeatMode) => void;

  togglePlay: () => void;
  setPlaybackSpeed: (s: 0.5 | 1 | 2 | 4) => void;
  setPlaybackProgress: (p: number) => void;
  selectTask: (id: string | null) => void;
  toggleHighlight: (id: string) => void;

  fetchStructure: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  timeRange: getDefaultTimeRange(),
  shift: 'all',
  selectedStrategies: [],

  layers: {
    warehouse: true,
    rackLabels: true,
    paths: true,
    heat: true,
    pickers: true,
  },
  heatOpacity: 0.75,
  heatMode: 'volumetric',

  isPlaying: false,
  playbackSpeed: 1,
  playbackProgress: 0,
  selectedTaskId: null,
  highlightedTaskIds: [],

  structure: null,
  tasks: [],
  kpis: null,
  congestionZones: [],
  strategyCompare: [],
  heatGrid: null,
  loading: false,
  error: null,

  setTimeRange: (start, end) => {
    set({ timeRange: { start, end }, playbackProgress: 0 });
    void get().fetchAll();
  },
  setShift: (s) => {
    set({ shift: s });
    void get().fetchAll();
  },
  toggleStrategy: (s) => {
    const cur = get().selectedStrategies;
    const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
    set({ selectedStrategies: next });
    void get().fetchAll();
  },
  setSelectedStrategies: (arr) => {
    set({ selectedStrategies: arr });
    void get().fetchAll();
  },

  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setHeatOpacity: (v) => set({ heatOpacity: v }),
  setHeatMode: (m) => set({ heatMode: m }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),
  setPlaybackProgress: (p) => set({ playbackProgress: Math.max(0, Math.min(1, p)) }),
  selectTask: (id) => set({ selectedTaskId: id, isPlaying: id ? get().isPlaying : false }),
  toggleHighlight: (id) =>
    set((s) => ({
      highlightedTaskIds: s.highlightedTaskIds.includes(id)
        ? s.highlightedTaskIds.filter((x) => x !== id)
        : [...s.highlightedTaskIds, id],
    })),

  fetchStructure: async () => {
    try {
      const structure = await mockAPI.getStructure();
      set({ structure });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  fetchAll: async () => {
    const { timeRange, shift, selectedStrategies } = get();
    set({ loading: true, error: null });
    const params = {
      startTime: timeRange.start,
      endTime: timeRange.end,
      shift,
      strategies: selectedStrategies.length > 0 ? selectedStrategies : undefined,
    };
    try {
      if (!get().structure) {
        await get().fetchStructure();
      }
      const [tasks, kpis, congestionZones, strategyCompare, heatGrid] = await Promise.all([
        mockAPI.getTasks(params),
        mockAPI.getKPIs(params),
        mockAPI.getCongestionZones(params, 5),
        mockAPI.getStrategyCompare(params),
        mockAPI.getHeatGrid(params, 1),
      ]);
      set({ tasks, kpis, congestionZones, strategyCompare, heatGrid, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
