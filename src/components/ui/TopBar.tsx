import { useMemo } from 'react';
import { Warehouse, Calendar, Clock, RefreshCw, AlertTriangle, Search, CalendarClock, Layers3, Sparkles, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { STRATEGY_LABELS, STRATEGY_COLORS, SHIFT_LABELS, ANOMALY_COLORS } from '@/types';
import type { StrategyType, ShiftFilter } from '@/types';

const STRATEGIES: StrategyType[] = ['S_SHAPED', 'ZONED_RELAY', 'WAVE_PICKING'];
const SHIFTS: ShiftFilter[] = ['all', 'morning', 'afternoon', 'night'];

type Preset = {
  label: string;
  startHour: number;
  endHour: number;
  shift: ShiftFilter;
};

const PRESETS: Preset[] = [
  { label: '早班', startHour: 6, endHour: 14, shift: 'morning' },
  { label: '中班', startHour: 14, endHour: 22, shift: 'afternoon' },
  { label: '晚班', startHour: 22, endHour: 30, shift: 'night' },
  { label: '昨日', startHour: 0, endHour: 24, shift: 'all' },
  { label: '本周', startHour: -7 * 24, endHour: 0, shift: 'all' },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  return { md, hh, mm, full: `${md} ${hh}:${mm}` };
}

export function TopBar() {
  const {
    timeRange,
    shift,
    selectedStrategies,
    setShift,
    toggleStrategy,
    setTimeRange,
    fetchAll,
    loading,
    tasks,
    taskAnomalies,
    searchPanelOpen,
    setSearchPanelOpen,
  } = useAppStore();

  const anomalyCount = useMemo(() => {
    let n = 0;
    taskAnomalies.forEach((a) => {
      if (a.flags.length > 0) n++;
    });
    return n;
  }, [taskAnomalies]);

  const startFmt = formatTime(timeRange.start);
  const endFmt = formatTime(timeRange.end);

  const applyPreset = (p: Preset) => {
    const base = new Date('2026-06-16T00:00:00');
    const start = new Date(base.getTime() + p.startHour * 3600 * 1000);
    const end = new Date(base.getTime() + p.endHour * 3600 * 1000);
    setShift(p.shift);
    setTimeRange(start.toISOString(), end.toISOString());
  };

  const onTimeChange = (which: 'start' | 'end', value: string) => {
    const [date, time] = value.split('T');
    const base = new Date(timeRange[which]);
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      base.setFullYear(y, (m || 1) - 1, d || 1);
    }
    if (time) {
      const [h, min] = time.split(':').map(Number);
      base.setHours(h || 0, min || 0, 0, 0);
    }
    if (which === 'start') {
      setTimeRange(base.toISOString(), timeRange.end);
    } else {
      setTimeRange(timeRange.start, base.toISOString());
    }
  };

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const activePreset = useMemo(
    () =>
      PRESETS.find((p) => {
        const b = new Date('2026-06-16T00:00:00');
        const s = new Date(b.getTime() + p.startHour * 3600 * 1000).getTime();
        const e = new Date(b.getTime() + p.endHour * 3600 * 1000).getTime();
        const rs = new Date(timeRange.start).getTime();
        const re = new Date(timeRange.end).getTime();
        return Math.abs(rs - s) < 60000 && Math.abs(re - e) < 60000 && p.shift === shift;
      }),
    [timeRange, shift]
  );

  return (
    <div className="h-12 w-full flex items-center gap-3 px-4 panel rounded-none border-x-0 border-t-0 relative z-20">
      <div className="flex items-center gap-2 pr-4 border-r border-white/10">
        <div className="relative">
          <Warehouse className="w-6 h-6 text-steel-cyan" strokeWidth={1.8} />
          <Sparkles className="w-3 h-3 text-steel-yellow absolute -right-1 -top-1 animate-pulse" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-wide text-white">WareViz</div>
          <div className="text-[10px] text-slate-400 tracking-[0.12em] font-mono-num">3D WAREHOUSE ANALYTICS</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`chip ${activePreset?.label === p.label ? 'chip-active' : 'chip-idle'}`}
          >
            <CalendarClock className="w-3 h-3" />
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-white/10 mx-1" />

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <CalendarClock className="w-3.5 h-3.5 text-steel-cyan/80" />
          时间
        </label>
        <input
          type="datetime-local"
          value={toLocalInput(timeRange.start)}
          step={900}
          onChange={(e) => onTimeChange('start', e.target.value)}
          className="bg-space-850/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono-num text-slate-200 focus:outline-none focus:border-steel-cyan/50 focus:shadow-glow-sm transition-all w-[152px]"
        />
        <span className="text-steel-cyan/80 text-xs">→</span>
        <input
          type="datetime-local"
          value={toLocalInput(timeRange.end)}
          step={900}
          onChange={(e) => onTimeChange('end', e.target.value)}
          className="bg-space-850/80 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono-num text-slate-200 focus:outline-none focus:border-steel-cyan/50 focus:shadow-glow-sm transition-all w-[152px]"
        />
        <span className="text-[10px] font-mono-num text-slate-500 ml-1">
          {startFmt.full} ~ {endFmt.full}
        </span>
      </div>

      <div className="h-6 w-px bg-white/10 mx-1" />

      <div className="flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-steel-cyan/80" />
        {SHIFTS.map((s) => (
          <button
            key={s}
            onClick={() => setShift(s)}
            className={`chip ${shift === s ? 'chip-active' : 'chip-idle'}`}
            title={SHIFT_LABELS[s]}
          >
            {SHIFT_LABELS[s].split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-white/10 mx-1" />

      <div className="flex items-center gap-1.5">
        <Layers3 className="w-3.5 h-3.5 text-steel-cyan/80" />
        {STRATEGIES.map((s) => (
          <button
            key={s}
            onClick={() => toggleStrategy(s)}
            className={`chip ${selectedStrategies.includes(s) ? 'chip-active' : 'chip-idle'}`}
            style={
              selectedStrategies.includes(s)
                ? {
                    backgroundColor: `${STRATEGY_COLORS[s]}22`,
                    borderColor: `${STRATEGY_COLORS[s]}66`,
                    color: STRATEGY_COLORS[s],
                    boxShadow: `0 0 10px ${STRATEGY_COLORS[s]}33`,
                  }
                : undefined
            }
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: STRATEGY_COLORS[s] }}
            />
            {STRATEGY_LABELS[s]}
          </button>
        ))}
        {selectedStrategies.length > 0 && (
          <span className="text-[10px] text-slate-500">
            {selectedStrategies.length} 种对比中
          </span>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-[10px] font-mono-num text-slate-400 pr-2">
        <span className="px-1.5 py-0.5 rounded bg-space-850/60 border border-white/5">
          <span className="text-steel-cyan">{tasks.length}</span> 任务
        </span>
        {anomalyCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded border flex items-center gap-1"
            style={{ backgroundColor: `${ANOMALY_COLORS.LONG_DURATION}10`, borderColor: `${ANOMALY_COLORS.LONG_DURATION}33`, color: ANOMALY_COLORS.LONG_DURATION }}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            {anomalyCount} 异常
          </span>
        )}
      </div>

      <button
        onClick={() => setSearchPanelOpen(!searchPanelOpen)}
        className={`btn-icon group relative ${searchPanelOpen ? 'bg-cyan-500/15 border-cyan-400/40' : ''}`}
        title="任务追溯检索 (按任务号/订单/拣货员)"
      >
        <Search className={`w-4 h-4 ${searchPanelOpen ? 'text-cyan-300' : ''}`} />
        {anomalyCount > 0 && !searchPanelOpen && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1"
            style={{ backgroundColor: ANOMALY_COLORS.LONG_DURATION, color: '#0a0f1c' }}
          >
            {anomalyCount}
          </span>
        )}
      </button>

      <button
        onClick={() => fetchAll()}
        disabled={loading}
        className="btn-icon group"
        title="刷新数据"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
      </button>

      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-steel-cyan/60 to-steel-purple/60 flex items-center justify-center text-[11px] font-semibold text-space-900 shadow-glow-sm">
        OP
      </div>
    </div>
  );
}
