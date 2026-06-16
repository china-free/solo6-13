import { useMemo, useState } from 'react';
import { Search, X, Filter, AlertTriangle, User, Package, Timer, Route, ChevronDown, ChevronUp, ZoomIn, FilterX } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ANOMALY_LABELS, ANOMALY_COLORS, STRATEGY_LABELS, SHIFT_LABELS } from '@/types';
import type { AnomalyFlag, PickTask, TaskAnomaly } from '@/types';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}'${s.toString().padStart(2, '0')}"`;
}

function fmtTime(t: string) {
  const d = new Date(t);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function TaskAnomalyChip({ flag }: { flag: AnomalyFlag }) {
  return (
    <span
      className="chip text-[10px] font-mono uppercase tracking-wide"
      style={{ backgroundColor: `${ANOMALY_COLORS[flag]}22`, color: ANOMALY_COLORS[flag], borderColor: `${ANOMALY_COLORS[flag]}44` }}
    >
      <AlertTriangle className="w-2.5 h-2.5 mr-0.5 inline-block" />
      {ANOMALY_LABELS[flag]}
    </span>
  );
}

function TaskRow({
  task,
  anomaly,
  isSelected,
  isHighlighted,
  onSelect,
  onHighlight,
}: {
  task: PickTask;
  anomaly: TaskAnomaly | undefined;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  onHighlight: () => void;
}) {
  return (
    <div
      className={`group rounded-lg border transition-all cursor-pointer p-3 ${
        isSelected
          ? 'bg-steel-900/60 border-steel-400 shadow-[0_0_0_1px_rgba(119,202,255,0.3)]'
          : 'bg-space-900/40 border-white/10 hover:border-steel-500/60 hover:bg-space-800/40'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-steel-200 font-mono text-sm font-bold">{task.taskId}</span>
          {isHighlighted && (
            <span className="chip bg-cyan-500/15 text-cyan-300 border-cyan-400/30 text-[10px] px-1.5 py-0">已高亮</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHighlight();
          }}
          className="btn-icon text-[11px] opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5"
          title="高亮/取消高亮"
        >
          <Search className="w-3 h-3" />
        </button>
      </div>
      <div className="text-xs text-steel-400 font-mono mb-2">
        订单 {task.orderNo} · {SHIFT_LABELS[task.shift]} · {STRATEGY_LABELS[task.strategy]}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-steel-300 mb-2">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3 text-steel-500" />
          {task.pickerName}
        </span>
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3 text-steel-500" />
          {task.skuCount} SKU
        </span>
        <span className="flex items-center gap-1">
          <Route className="w-3 h-3 text-steel-500" />
          {task.totalDistance.toFixed(1)}m
        </span>
        <span className="flex items-center gap-1">
          <Timer className="w-3 h-3 text-steel-500" />
          {formatDuration(task.totalDuration)}
        </span>
      </div>
      {anomaly && anomaly.flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {anomaly.flags.map((f) => (
            <TaskAnomalyChip key={f} flag={f} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskSearchPanel() {
  const [filterExpanded, setFilterExpanded] = useState(true);
  const searchPanelOpen = useAppStore((s) => s.searchPanelOpen);
  const setSearchPanelOpen = useAppStore((s) => s.setSearchPanelOpen);
  const tasks = useAppStore((s) => s.tasks);
  const taskAnomalies = useAppStore((s) => s.taskAnomalies);
  const searchFilter = useAppStore((s) => s.searchFilter);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);
  const toggleAnomalyOnly = useAppStore((s) => s.toggleAnomalyOnly);
  const toggleAnomalyFilter = useAppStore((s) => s.toggleAnomalyFilter);
  const togglePickerFilter = useAppStore((s) => s.togglePickerFilter);
  const setTaskSort = useAppStore((s) => s.setTaskSort);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const highlightedTaskIds = useAppStore((s) => s.highlightedTaskIds);
  const selectTask = useAppStore((s) => s.selectTask);
  const toggleHighlight = useAppStore((s) => s.toggleHighlight);

  const uniquePickers = useMemo(() => {
    const set = new Map<string, string>();
    tasks.forEach((t) => set.set(t.pickerId, t.pickerName));
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const anomalyTasksCount = useMemo(() => {
    let n = 0;
    taskAnomalies.forEach((a) => {
      if (a.flags.length > 0) n++;
    });
    return n;
  }, [taskAnomalies]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    const kw = searchFilter.keyword.trim().toLowerCase();
    if (kw) {
      list = list.filter((t) => {
        return (
          t.taskId.toLowerCase().includes(kw) ||
          t.orderNo.toLowerCase().includes(kw) ||
          t.pickerName.toLowerCase().includes(kw) ||
          t.pickerId.toLowerCase().includes(kw)
        );
      });
    }
    if (searchFilter.anomalyOnly || searchFilter.anomalies.length > 0) {
      list = list.filter((t) => {
        const a = taskAnomalies.get(t.taskId);
        if (!a || a.flags.length === 0) return false;
        if (searchFilter.anomalies.length === 0) return true;
        return searchFilter.anomalies.some((f) => a.flags.includes(f));
      });
    }
    if (searchFilter.pickers.length > 0) {
      list = list.filter((t) => searchFilter.pickers.includes(t.pickerId));
    }
    list.sort((a, b) => {
      let av = 0;
      let bv = 0;
      switch (searchFilter.sortKey) {
        case 'distance':
          av = a.totalDistance;
          bv = b.totalDistance;
          break;
        case 'duration':
          av = a.totalDuration;
          bv = b.totalDuration;
          break;
        case 'skuCount':
          av = a.skuCount;
          bv = b.skuCount;
          break;
        case 'time':
        default:
          av = new Date(a.startTime).getTime();
          bv = new Date(b.startTime).getTime();
      }
      return searchFilter.sortDesc ? bv - av : av - bv;
    });
    return list;
  }, [tasks, searchFilter, taskAnomalies]);

  const sortLabel: Record<string, string> = {
    time: '开始时间',
    distance: '路径长度',
    duration: '任务耗时',
    skuCount: 'SKU 数量',
  };

  function resetFilters() {
    setSearchKeyword('');
    while (searchFilter.anomalies.length) toggleAnomalyFilter(searchFilter.anomalies[0]);
    while (searchFilter.pickers.length) togglePickerFilter(searchFilter.pickers[0]);
    if (searchFilter.anomalyOnly) toggleAnomalyOnly();
  }

  if (!searchPanelOpen) return null;

  return (
    <div className="absolute top-16 left-0 bottom-0 w-[340px] z-30 pointer-events-none">
      <div
        className="pointer-events-auto h-full panel rounded-none border-r border-t-0 border-l-0 border-b-0 border-white/10 bg-space-950/90 backdrop-blur-xl flex flex-col animate-[slideInLeft_0.2s_ease-out]"
        style={{ boxShadow: '8px 0 32px -8px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <div className="section-title !mb-0">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              任务追溯检索
            </div>
            <div className="text-[11px] text-steel-500 mt-1 font-mono">
              共 {tasks.length} 条任务 · <span className="text-red-400">{anomalyTasksCount} 异常</span>
              {filteredTasks.length !== tasks.length && ` · 命中 ${filteredTasks.length}`}
            </div>
          </div>
          <button className="btn-icon" onClick={() => setSearchPanelOpen(false)} title="关闭">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" />
            <input
              type="text"
              value={searchFilter.keyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索任务号 / 订单号 / 拣货员姓名 / ID..."
              className="w-full bg-space-900/60 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-steel-200 placeholder:text-steel-600 focus:outline-none focus:border-steel-400/60 focus:ring-2 focus:ring-steel-400/20 transition-all font-mono"
            />
            {searchFilter.keyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-steel-500 hover:text-steel-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="border-b border-white/10">
          <button
            onClick={() => setFilterExpanded(!filterExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
          >
            <div className="section-title !mb-0">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              筛选条件
            </div>
            <div className="flex items-center gap-2">
              {(searchFilter.anomalyOnly || searchFilter.anomalies.length > 0 || searchFilter.pickers.length > 0) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFilters();
                  }}
                  className="btn-icon text-[10px] h-5 gap-1"
                >
                  <FilterX className="w-3 h-3" />
                  清空
                </button>
              )}
              {filterExpanded ? <ChevronUp className="w-4 h-4 text-steel-400" /> : <ChevronDown className="w-4 h-4 text-steel-400" />}
            </div>
          </button>
          {filterExpanded && (
            <div className="px-4 pb-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={searchFilter.anomalyOnly}
                  onChange={toggleAnomalyOnly}
                  className="w-4 h-4 accent-cyan-500 bg-space-900"
                />
                <span className="text-sm text-steel-200">仅显示异常任务</span>
              </label>

              <div>
                <div className="text-[11px] text-steel-500 mb-1.5 uppercase tracking-wider">异常类型</div>
                <div className="flex flex-wrap gap-1.5">
                  {(['LONG_DISTANCE', 'LONG_DURATION', 'HIGH_REVISIT', 'SLOW_DWELL'] as AnomalyFlag[]).map((f) => {
                    const active = searchFilter.anomalies.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => toggleAnomalyFilter(f)}
                        className={`chip text-[11px] font-mono transition-all ${
                          active ? '' : 'opacity-50'
                        }`}
                        style={{
                          backgroundColor: active ? `${ANOMALY_COLORS[f]}22` : 'transparent',
                          color: ANOMALY_COLORS[f],
                          borderColor: active ? `${ANOMALY_COLORS[f]}66` : 'rgba(255,255,255,0.1)',
                        }}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1 inline-block" />
                        {ANOMALY_LABELS[f]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-steel-500 mb-1.5 uppercase tracking-wider">拣货员 ({uniquePickers.length})</div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollbar-thin">
                  {uniquePickers.map((p) => {
                    const active = searchFilter.pickers.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePickerFilter(p.id)}
                        className={`chip text-[11px] ${
                          active ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40' : 'bg-transparent'
                        }`}
                      >
                        <User className="w-3 h-3 mr-1 inline-block" />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-steel-500 mb-1.5 uppercase tracking-wider">排序方式</div>
                <div className="flex flex-wrap gap-1.5">
                  {(['time', 'distance', 'duration', 'skuCount'] as const).map((k) => {
                    const active = searchFilter.sortKey === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setTaskSort(k)}
                        className={`chip text-[11px] font-mono ${active ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40' : ''}`}
                      >
                        {sortLabel[k]}
                        {active && (searchFilter.sortDesc ? ' ↓' : ' ↑')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-steel-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <div className="text-sm">没有匹配的任务</div>
              <div className="text-xs text-steel-600 mt-1">调整筛选条件或搜索关键词</div>
            </div>
          ) : (
            filteredTasks.map((t) => (
              <TaskRow
                key={t.taskId}
                task={t}
                anomaly={taskAnomalies.get(t.taskId)}
                isSelected={selectedTaskId === t.taskId}
                isHighlighted={highlightedTaskIds.includes(t.taskId)}
                onSelect={() => {
                  selectTask(t.taskId);
                }}
                onHighlight={() => toggleHighlight(t.taskId)}
              />
            ))
          )}
        </div>

        <div className="px-3 py-2 border-t border-white/10 bg-space-950/80">
          <div className="text-[10px] text-steel-600 font-mono flex items-center gap-2">
            <ZoomIn className="w-3 h-3" />
            点击任务：居中视角并展开详情 · 悬停点击放大镜：高亮路径
          </div>
        </div>
      </div>
    </div>
  );
}
