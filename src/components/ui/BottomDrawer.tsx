import { useState, useEffect, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  X,
  Package,
  User,
  Route,
  Timer,
  Box,
  Clock,
  MapPin,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { STRATEGY_LABELS, STRATEGY_COLORS, SHIFT_LABELS, ANOMALY_COLORS, ANOMALY_LABELS } from '@/types';
import { computeTaskZoneDwell, type ZoneDwellEntry } from '@/services/mockAPI';

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h${m}m${sec}s`;
  if (m > 0) return `${m}分${sec}秒`;
  return `${sec}秒`;
}

export function BottomDrawer() {
  const { selectedTaskId, tasks, selectTask, playbackProgress, taskAnomalies, structure, strategyCompare } = useAppStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selectedTaskId) setOpen(true);
  }, [selectedTaskId]);

  const task = tasks.find((t) => t.taskId === selectedTaskId) ?? null;

  const zoneDwell = useMemo<ZoneDwellEntry[]>(() => {
    if (!task || !structure) return [];
    return computeTaskZoneDwell(task, structure);
  }, [task, structure]);

  const strategyBenchmark = useMemo(() => {
    if (!task) return null;
    const avg = strategyCompare.find((s) => s.strategy === task.strategy);
    if (!avg) return null;
    return {
      distPct: Math.round(((task.totalDistance - avg.avgDistance) / avg.avgDistance) * 100),
      durPct: Math.round(((task.totalDuration - avg.avgDuration) / avg.avgDuration) * 100),
      revisitDiff: Math.round((task.nodes.length - task.nodes.filter((n, i, arr) => arr.findIndex((x) => x.rackId === n.rackId) === i).length) / Math.max(1, task.nodes.length) * 100 - avg.revisitRate * 100),
      avgDistance: avg.avgDistance,
      avgDuration: avg.avgDuration,
    };
  }, [task, strategyCompare]);

  if (!task) return null;

  const anomaly = taskAnomalies.get(task.taskId);
  const strategyColor = STRATEGY_COLORS[task.strategy] ?? '#00D4FF';
  const currentT = playbackProgress * task.totalDuration;

  return (
    <div className="absolute left-[340px] right-[340px] bottom-3 z-10">
      <div className="panel rounded-xl overflow-hidden transition-all duration-300" style={{ maxHeight: open ? 300 : 56 }}>
        <div
          className="h-14 px-4 flex items-center gap-3 cursor-pointer select-none hover:bg-space-800/40 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${strategyColor}33, ${strategyColor}11)`,
              border: `1px solid ${strategyColor}55`,
              boxShadow: `0 0 10px ${strategyColor}22`,
            }}
          >
            <Package className="w-4 h-4" style={{ color: strategyColor }} />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-mono-num">任务</span>
                <span className="text-sm font-semibold text-white font-mono-num">{task.taskId}</span>
                {anomaly && anomaly.flags.length > 0 && anomaly.flags.map((f) => (
                  <span
                    key={f}
                    className="chip text-[10px] font-mono uppercase tracking-wide"
                    style={{ backgroundColor: `${ANOMALY_COLORS[f]}22`, color: ANOMALY_COLORS[f], borderColor: `${ANOMALY_COLORS[f]}44` }}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5 inline-block" />
                    {ANOMALY_LABELS[f]}
                  </span>
                ))}
                <span
                  className="chip"
                  style={{
                    backgroundColor: `${strategyColor}18`,
                    borderColor: `${strategyColor}44`,
                    color: strategyColor,
                  }}
                >
                  {STRATEGY_LABELS[task.strategy]}
                </span>
                <span className="chip chip-idle">{SHIFT_LABELS[task.shift].split(' ')[0]}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>订单 <span className="text-slate-200 font-mono-num">{task.orderNo}</span></span>
                <span>·</span>
                <User className="w-3 h-3" />
                <span className="text-slate-200">{task.pickerName} ({task.pickerId})</span>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto pr-2">
              <Metric icon={Route} label="路径" value={`${task.totalDistance.toFixed(0)} 米`} color="#00D4FF" />
              <Metric icon={Timer} label="耗时" value={fmtDuration(task.totalDuration)} color="#FFC93C" />
              <Metric icon={Box} label="SKU" value={`${task.skuCount} 件`} color="#00FF94" />
              <Metric icon={MapPin} label="节点" value={`${task.nodes.length} 个`} color="#B794F4" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-space-850/80 border border-white/10">
              <Clock className="w-3 h-3 text-steel-cyan" />
              <span className="text-[11px] font-mono-num text-slate-300">
                {fmtDuration(currentT)} / {fmtDuration(task.totalDuration)}
              </span>
            </div>
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                selectTask(null);
              }}
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
            <button className="btn-icon" onClick={(e) => e.stopPropagation()}>
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/10 px-4 py-3 grid grid-cols-[260px_300px_1fr] gap-4" style={{ height: 244 }}>
            <div className="flex flex-col gap-3 overflow-hidden">
              <div>
                <div className="section-title">任务概览</div>
                <div className="section-underline" />
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11px]">
                  <Row label="开始时间" value={fmtTime(task.startTime)} mono />
                  <Row label="结束时间" value={fmtTime(task.endTime)} mono />
                  <Row label="平均步速" value={`${(task.totalDistance / (task.totalDuration / 60)).toFixed(1)} 米/分`} mono />
                  <Row label="单SKU耗时" value={`${fmtDuration(task.totalDuration / Math.max(1, task.skuCount))}`} mono />
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <div className="section-title flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-steel-cyan" />
                  区域停留分布
                </div>
                <div className="section-underline" />
                <div className="space-y-1 pr-1 max-h-[130px] overflow-y-auto scrollbar-thin">
                  {zoneDwell.length === 0 ? (
                    <div className="text-[10px] text-slate-500 text-center py-3">无区域数据</div>
                  ) : (
                    zoneDwell.map((z) => {
                      const zoneColor = structure?.zones.find((zz) => zz.id === z.zoneId)?.color || '#00D4FF';
                      return (
                        <div key={z.zoneId} className="group">
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-sm"
                                style={{ backgroundColor: zoneColor }}
                              />
                              <span className="text-slate-300 font-semibold">{z.zoneName}</span>
                              <span className="text-slate-500">
                                {z.nodeCount}站 · {z.skuQty}件
                              </span>
                            </span>
                            <span className="text-slate-400 font-mono-num">
                              {fmtDuration(z.dwellTime)} · {z.pct}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-space-700/70 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${z.pct}%`,
                                background: `linear-gradient(90deg, ${zoneColor}88, ${zoneColor})`,
                                boxShadow: `0 0 6px ${zoneColor}44`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 overflow-hidden">
              <div>
                <div className="section-title flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3 text-steel-cyan" />
                  同策略基准对比
                  <span
                    className="chip ml-auto text-[9px] font-mono py-0 h-4"
                    style={{ backgroundColor: `${strategyColor}22`, color: strategyColor, borderColor: `${strategyColor}55` }}
                  >
                    {STRATEGY_LABELS[task.strategy]}
                  </span>
                </div>
                <div className="section-underline" />
                {strategyBenchmark ? (
                  <div className="space-y-1.5 mt-1">
                    <BenchmarkRow
                      label="路径长度"
                      taskVal={`${task.totalDistance.toFixed(0)}m`}
                      baseVal={`${strategyBenchmark.avgDistance.toFixed(0)}m`}
                      pct={strategyBenchmark.distPct}
                      icon={Route}
                    />
                    <BenchmarkRow
                      label="任务耗时"
                      taskVal={fmtDuration(task.totalDuration)}
                      baseVal={fmtDuration(strategyBenchmark.avgDuration)}
                      pct={strategyBenchmark.durPct}
                      icon={Timer}
                    />
                    <BenchmarkRow
                      label="回头率"
                      taskVal={`${Math.round((task.nodes.filter((n, i, arr) => arr.findIndex((x) => x.rackId === n.rackId) !== i).length / Math.max(1, task.nodes.length)) * 100)}%`}
                      baseVal={`${Math.round(strategyCompare.find((s) => s.strategy === task.strategy)?.revisitRate! * 100)}%`}
                      pct={strategyBenchmark.revisitDiff}
                      icon={Layers}
                    />
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 text-center py-3">加载中...</div>
                )}
              </div>
            </div>

            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <div className="section-title">拣货节点序列（共 {task.nodes.length} 站）</div>
                <div className="text-[10px] text-slate-500 font-mono-num">
                  播放进度: {Math.round(playbackProgress * 100)}%
                </div>
              </div>
              <div className="section-underline" />
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 -mr-1 space-y-1">
                {task.nodes.map((n, i) => {
                  const nodeProgress = n.arriveAt / Math.max(1, task.totalDuration);
                  const passed = playbackProgress >= nodeProgress;
                  const active =
                    playbackProgress >= nodeProgress &&
                    playbackProgress <= n.leaveAt / Math.max(1, task.totalDuration);
                  return (
                    <div
                      key={n.nodeId}
                      className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
                        active
                          ? 'bg-steel-yellow/10 border-steel-yellow/40 shadow-glow-sm'
                          : passed
                          ? 'bg-steel-green/5 border-steel-green/20'
                          : 'bg-space-850/40 border-white/5'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono-num shrink-0 ${
                          active
                            ? 'bg-steel-yellow text-space-900 animate-pulse'
                            : passed
                            ? 'bg-steel-green/80 text-space-900'
                            : 'bg-space-700/80 text-slate-400'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono-num font-semibold text-slate-100">
                            货位 {n.slotCode}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            货架 {n.rackId}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono-num flex items-center gap-2 mt-0.5">
                          <span>
                            到达 {fmtDuration(n.arriveAt)}
                          </span>
                          <span>·</span>
                          <span>停留 <span className="text-steel-yellow">{fmtDuration(n.dwellTime)}</span></span>
                          <span>·</span>
                          <span>
                            拣取 <span className="text-steel-green">{n.skuQty}</span> 件
                          </span>
                        </div>
                      </div>
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-steel-yellow animate-ping mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-3 h-3" style={{ color }} />
      </div>
      <div className="leading-tight">
        <div className="text-[9px] text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-[12px] font-mono-num font-semibold" style={{ color }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`text-slate-200 ${mono ? 'font-mono-num' : ''}`}>{value}</span>
    </div>
  );
}

function TimeBar({ label, pct, color, value }: { label: string; pct: number; color: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-0.5">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono-num" style={{ color }}>
          {value} · {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-space-800/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

function BenchmarkRow({
  label,
  taskVal,
  baseVal,
  pct,
  icon: Icon,
}: {
  label: string;
  taskVal: string;
  baseVal: string;
  pct: number;
  icon: typeof Package;
}) {
  const isGood = label === '路径长度' || label === '任务耗时' || label === '回头率' ? pct < 0 : pct > 0;
  const color = Math.abs(pct) < 10 ? '#64748b' : isGood ? '#00FF94' : '#FF4D6D';
  const displayPct = pct === 0 ? '±0' : pct > 0 ? `+${pct}` : `${pct}`;
  return (
    <div className="flex items-center gap-2 rounded-md bg-space-850/40 border border-white/5 px-2 py-1.5">
      <div
        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-2.5 h-2.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">{label}</span>
          <span className="font-mono-num font-bold" style={{ color }}>
            {displayPct}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] mt-0.5">
          <span className="text-slate-300 font-mono-num">任务 {taskVal}</span>
          <span className="text-slate-500 font-mono-num">均值 {baseVal}</span>
        </div>
      </div>
    </div>
  );
}
