import { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { STRATEGY_LABELS, STRATEGY_COLORS, SHIFT_LABELS } from '@/types';

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
  const { selectedTaskId, tasks, selectTask, playbackProgress } = useAppStore();
  const [open, setOpen] = useState(false);

  const task = tasks.find((t) => t.taskId === selectedTaskId) ?? null;

  if (!task) return null;

  const strategyColor = STRATEGY_COLORS[task.strategy] ?? '#00D4FF';
  const currentT = playbackProgress * task.totalDuration;

  return (
    <div className="absolute left-[300px] right-[340px] bottom-3 z-10">
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
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-mono-num">任务</span>
                <span className="text-sm font-semibold text-white font-mono-num">{task.taskId}</span>
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
          <div className="border-t border-white/10 px-4 py-3 grid grid-cols-[320px_1fr] gap-4" style={{ height: 244 }}>
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
                <div className="section-title">时间分布</div>
                <div className="section-underline" />
                <div className="space-y-1 pr-1">
                  <TimeBar label="移动时间" pct={62} color="#00D4FF" value={fmtDuration(task.totalDuration * 0.62)} />
                  <TimeBar label="拣货停留" pct={32} color="#FFC93C" value={fmtDuration(task.totalDuration * 0.32)} />
                  <TimeBar label="其他等待" pct={6} color="#B794F4" value={fmtDuration(task.totalDuration * 0.06)} />
                </div>
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
