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
  TaskAnomaly,
  TaskSearchFilter,
  AnomalyFlag,
  TaskSortKey,
} from '@/types';
import { mockAPI, analyzeTaskAnomalies } from '@/services/mockAPI';

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
  taskAnomalies: Map<string, TaskAnomaly>;
  kpis: KPIData | null;
  congestionZones: CongestionZone[];
  strategyCompare: StrategyCompare[];
  heatGrid: HeatGrid | null;
  loading: boolean;
  error: string | null;

  searchPanelOpen: boolean;
  searchFilter: TaskSearchFilter;

  drillDownZoneId: string | null;
  drillDownCongestionId: string | null;

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

  setSearchPanelOpen: (open: boolean) => void;
  setSearchKeyword: (kw: string) => void;
  toggleAnomalyOnly: () => void;
  toggleAnomalyFilter: (flag: AnomalyFlag) => void;
  togglePickerFilter: (pickerId: string) => void;
  setTaskSort: (key: TaskSortKey, desc?: boolean) => void;

  setDrillDownZoneId: (id: string | null) => void;
  setDrillDownCongestionId: (id: string | null) => void;
  toggleZoneFilter: (zoneId: string) => void;
  clearDrillDown: () => void;

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
  taskAnomalies: new Map(),
  kpis: null,
  congestionZones: [],
  strategyCompare: [],
  heatGrid: null,
  loading: false,
  error: null,

  searchPanelOpen: false,
  searchFilter: {
    keyword: '',
    anomalyOnly: false,
    anomalies: [],
    pickers: [],
    zones: [],
    strategies: [],
    sortKey: 'time',
    sortDesc: true,
  },

  drillDownZoneId: null,
  drillDownCongestionId: null,

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
  selectTask: (id) => set({ selectedTaskId: id, playbackProgress: 0, isPlaying: false }),
  toggleHighlight: (id) =>
    set((s) => ({
      highlightedTaskIds: s.highlightedTaskIds.includes(id)
        ? s.highlightedTaskIds.filter((x) => x !== id)
        : [...s.highlightedTaskIds, id],
    })),

  setSearchPanelOpen: (open) => set({ searchPanelOpen: open }),
  setSearchKeyword: (kw) => set((s) => ({ searchFilter: { ...s.searchFilter, keyword: kw } })),
  toggleAnomalyOnly: () => set((s) => ({ searchFilter: { ...s.searchFilter, anomalyOnly: !s.searchFilter.anomalyOnly } })),
  toggleAnomalyFilter: (flag) =>
    set((s) => {
      const has = s.searchFilter.anomalies.includes(flag);
      return {
        searchFilter: {
          ...s.searchFilter,
          anomalies: has ? s.searchFilter.anomalies.filter((x) => x !== flag) : [...s.searchFilter.anomalies, flag],
        },
      };
    }),
  togglePickerFilter: (pickerId) =>
    set((s) => {
      const has = s.searchFilter.pickers.includes(pickerId);
      return {
        searchFilter: {
          ...s.searchFilter,
          pickers: has ? s.searchFilter.pickers.filter((x) => x !== pickerId) : [...s.searchFilter.pickers, pickerId],
        },
      };
    }),
  setTaskSort: (key, desc) =>
    set((s) => ({
      searchFilter: {
        ...s.searchFilter,
        sortKey: key,
        sortDesc: desc ?? (s.searchFilter.sortKey === key ? !s.searchFilter.sortDesc : true),
      },
    })),
  toggleZoneFilter: (zoneId) =>
    set((s) => {
      const has = s.searchFilter.zones.includes(zoneId);
      return {
        searchFilter: {
          ...s.searchFilter,
          zones: has ? s.searchFilter.zones.filter((x) => x !== zoneId) : [...s.searchFilter.zones, zoneId],
        },
      };
    }),
  setDrillDownZoneId: (id) =>
    set((s) => {
      const next = s.drillDownZoneId === id ? null : id;
      return {
        drillDownZoneId: next,
        drillDownCongestionId: null,
        searchFilter: {
          ...s.searchFilter,
          zones: next ? [next] : s.searchFilter.zones.filter((x) => false),
        },
      };
    }),
  setDrillDownCongestionId: (id) =>
    set((s) => {
      const next = s.drillDownCongestionId === id ? null : id;
      return { drillDownCongestionId: next };
    }),
  clearDrillDown: () =>
    set((s) => ({
      drillDownZoneId: null,
      drillDownCongestionId: null,
      searchFilter: {
        ...s.searchFilter,
        zones: [],
      },
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
      set({ tasks, taskAnomalies: analyzeTaskAnomalies(tasks), kpis, congestionZones, strategyCompare, heatGrid, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
