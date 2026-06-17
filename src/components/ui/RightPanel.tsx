import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Route,
  Timer,
  Activity,
  ListOrdered,
  AlertTriangle,
  BarChart3,
  Sparkles,
  MapPin,
  Layers,
  Search,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { STRATEGY_LABELS, STRATEGY_COLORS, ANOMALY_COLORS, ANOMALY_LABELS } from '@/types';
import { buildRackZoneMap } from '@/services/mockAPI';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

function TrendBadge({ value }: { value: number }) {
  const up = value > 0;
  const neutral = Math.abs(value) < 0.5;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono-num ${
        neutral
          ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          : up
          ? 'bg-steel-green/10 text-steel-green border border-steel-green/30'
          : 'bg-steel-red/10 text-steel-red border border-steel-red/30'
      }`}
    >
      {neutral ? '·' : up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {value >= 0 ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

function KPICards() {
  const { kpis, loading } = useAppStore();

  const cards = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        label: '完成任务数',
        value: kpis.totalTasks.toLocaleString(),
        unit: '单',
        icon: ListOrdered,
        color: '#00D4FF',
        trend: kpis.comparePrevious.totalTasks,
      },
      {
        label: '平均路径长度',
        value: kpis.avgDistance.toFixed(1),
        unit: '米',
        icon: Route,
        color: '#00FF94',
        trend: -kpis.comparePrevious.avgDistance,
        flipTrend: true,
      },
      {
        label: '平均拣货耗时',
        value: (kpis.avgDuration / 60).toFixed(1),
        unit: '分钟',
        icon: Timer,
        color: '#FFC93C',
        trend: -kpis.comparePrevious.avgDuration,
        flipTrend: true,
      },
      {
        label: '拥堵指数',
        value: kpis.congestionIndex.toString(),
        unit: '/100',
        icon: Activity,
        color: kpis.congestionIndex > 65 ? '#FF4D6D' : kpis.congestionIndex > 40 ? '#FFC93C' : '#00FF94',
        trend: kpis.comparePrevious.congestionIndex,
        flipTrend: true,
      },
    ];
  }, [kpis]);

  return (
    <div>
      <div className="section-title flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        KPI 概览
      </div>
      <div className="section-underline" />
      <div className="grid grid-cols-2 gap-2">
        {loading && !kpis
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kpi-card animate-pulse">
                <div className="h-3 w-16 bg-space-700/50 rounded mb-2" />
                <div className="h-6 w-20 bg-space-700/50 rounded mb-1" />
                <div className="h-2 w-12 bg-space-700/50 rounded" />
              </div>
            ))
          : cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="kpi-card group"
                  style={{
                    background: `linear-gradient(135deg, rgba(10,22,40,0.8), ${c.color}08)`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] text-slate-400">{c.label}</div>
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${c.color}15`, border: `1px solid ${c.color}33` }}
                    >
                      <Icon className="w-3 h-3" style={{ color: c.color }} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-xl font-bold font-mono-num tracking-tight"
                      style={{ color: c.color, textShadow: `0 0 10px ${c.color}44` }}
                    >
                      {c.value}
                    </span>
                    <span className="text-[10px] text-slate-500">{c.unit}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <TrendBadge value={c.trend} />
                    <div className="w-12 h-5 opacity-50">
                      <svg viewBox="0 0 48 20" className="w-full h-full">
                        <path
                          d={
                            'M0 ' +
                            (15 + Math.sin(cards.indexOf(c)) * 3) +
                            ' Q12 ' +
                            (10 + Math.cos(cards.indexOf(c)) * 4) +
                            ' 24 ' +
                            (12 + Math.sin(cards.indexOf(c) + 1) * 3) +
                            ' T48 8'
                          }
                          fill="none"
                          stroke={c.color}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          className="animated-dash"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

function CongestionList() {
  const { congestionZones, tasks, structure, drillDownZoneId, drillDownCongestionId, setDrillDownZoneId, setDrillDownCongestionId, setSearchPanelOpen, selectTask, highlightedTaskIds, toggleHighlight, taskAnomalies } = useAppStore();

  const zoneStats = useMemo(() => {
    if (!structure) return new Map<string, { tasks: number; anomalies: number; topAnomaly: string | null; strategyBreakdown: Record<string, number>; worstTask: string | null }>();
    const rackZoneMap = buildRackZoneMap(structure);
    const m = new Map();
    structure.zones.forEach((z) => {
      m.set(z.id, { tasks: 0, anomalies: 0, topAnomaly: null as string | null, strategyBreakdown: {} as Record<string, number>, worstTask: null as string | null });
    });
    let worstScore = -1;
    tasks.forEach((t) => {
      const zones = new Set<string>();
      t.nodes.forEach((n) => {
        const zid = rackZoneMap.get(n.rackId);
        if (zid) zones.add(zid);
      });
      const a = taskAnomalies.get(t.taskId);
      zones.forEach((zid) => {
        const s = m.get(zid)!;
        s.tasks++;
        s.strategyBreakdown[t.strategy] = (s.strategyBreakdown[t.strategy] || 0) + 1;
        if (a && a.flags.length > 0) {
          s.anomalies++;
          a.flags.forEach((f) => {
            s.strategyBreakdown['_' + f] = (s.strategyBreakdown['_' + f] || 0) + 1;
          });
        }
        const score = a?.overallScore ?? 0;
        if (score > worstScore) {
          worstScore = score;
          s.worstTask = t.taskId;
        }
      });
    });
    m.forEach((s) => {
      let top: string | null = null;
      let topN = 0;
      ['_LONG_DISTANCE', '_LONG_DURATION', '_HIGH_REVISIT', '_SLOW_DWELL'].forEach((k) => {
        const n = s.strategyBreakdown[k] || 0;
        if (n > topN) { topN = n; top = k.slice(1); }
      });
      s.topAnomaly = top;
    });
    return m;
  }, [structure, tasks, taskAnomalies]);

  return (
    <div>
      <div className="section-title flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        TOP 拥堵区域
      </div>
      <div className="section-underline" />

      <div className="mb-2 flex flex-wrap gap-1">
        {structure?.zones.map((z) => {
          const st = zoneStats.get(z.id);
          const active = drillDownZoneId === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setDrillDownZoneId(z.id)}
              className="chip text-[10px] font-mono transition-all relative"
              style={{
                backgroundColor: active ? `${z.color}22` : `${z.color}08`,
                color: active ? z.color : undefined,
                borderColor: active ? `${z.color}66` : undefined,
              }}
              title={`${z.name}：${st?.tasks || 0} 条任务，${st?.anomalies || 0} 条异常`}
            >
              <span
                className="w-1.5 h-1.5 rounded-sm inline-block mr-1"
                style={{ backgroundColor: z.color }}
              />
              {z.name}
              {st && st.tasks > 0 && (
                <span className="ml-1 text-[9px] opacity-70">{st.tasks}</span>
              )}
              {st && st.anomalies > 0 && (
                <span
                  className="ml-1 px-1 rounded text-[9px] font-bold"
                  style={{ backgroundColor: `${ANOMALY_COLORS.LONG_DURATION}22`, color: ANOMALY_COLORS.LONG_DURATION }}
                >
                  {st.anomalies}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {congestionZones.length === 0 ? (
          <div className="text-[11px] text-slate-500 text-center py-4">暂无数据</div>
        ) : (
          congestionZones.map((z, i) => {
            const score = z.passCount * z.avgDwellTime;
            const max = congestionZones[0]?.passCount * congestionZones[0]?.avgDwellTime || 1;
            const pct = Math.round((score / max) * 100);
            const color = pct > 75 ? '#FF4D6D' : pct > 50 ? '#FFC93C' : '#00FF94';
            const zid = z.zoneId;
            const zone = structure?.zones.find((zz) => zz.id === zid) || null;
            const st = zone ? zoneStats.get(zid) : undefined;
            const active = drillDownCongestionId === z.zoneId || drillDownZoneId === z.zoneId;
            return (
              <div
                key={z.zoneId}
                className={`rounded-lg border p-2.5 transition-all cursor-pointer group ${
                  active
                    ? 'border-steel-400 bg-space-800/60 shadow-[0_0_0_1px_rgba(119,202,255,0.2)]'
                    : 'border-white/10 bg-space-850/50 hover:border-white/20'
                }`}
                onClick={() => {
                  setDrillDownCongestionId(z.zoneId);
                  if (zone && drillDownZoneId !== z.zoneId) {
                    setDrillDownZoneId(z.zoneId);
                  } else {
                    setSearchPanelOpen(true);
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono-num text-space-900"
                    style={{ backgroundColor: color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      {zone && (
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: zone.color }}
                        />
                      )}
                      <div className="text-xs font-semibold text-slate-100 truncate">{z.zoneName}</div>
                      <ChevronRight className="w-3 h-3 text-steel-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-mono-num">
                      <span>
                        经过 <span className="text-slate-200">{z.passCount}</span> 次
                      </span>
                      <span>·</span>
                      <span>
                        停留 <span className="text-slate-200">{z.avgDwellTime}</span>s
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {st?.topAnomaly && (
                      <span
                        className="chip text-[9px] font-mono uppercase leading-none py-0 h-4"
                        style={{
                          backgroundColor: `${ANOMALY_COLORS[st.topAnomaly as keyof typeof ANOMALY_COLORS]}22`,
                          color: ANOMALY_COLORS[st.topAnomaly as keyof typeof ANOMALY_COLORS],
                          borderColor: `${ANOMALY_COLORS[st.topAnomaly as keyof typeof ANOMALY_COLORS]}44`,
                        }}
                      >
                        <AlertTriangle className="w-2 h-2 mr-0.5 inline-block" />
                        {ANOMALY_LABELS[st.topAnomaly as keyof typeof ANOMALY_LABELS]}
                      </span>
                    )}
                    {st && st.tasks > 0 && (
                      <button
                        className="btn-icon text-[9px] h-4 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchPanelOpen(true);
                        }}
                      >
                        <Search className="w-2 h-2" />
                        查任务
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-space-700/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}99, ${color})`,
                      boxShadow: `0 0 8px ${color}66`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-slate-400 flex items-start gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-steel-cyan/60 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{z.suggestion}</span>
                </div>
                {st && active && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-steel-500 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        任务策略分布
                      </div>
                      <div className="text-[10px] text-steel-400 font-mono">
                        共 {st.tasks} 任务 · {st.anomalies} 异常
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(st.strategyBreakdown)
                        .filter(([k]) => !k.startsWith('_'))
                        .map(([k, v]) => {
                          const col = STRATEGY_COLORS[k as keyof typeof STRATEGY_COLORS] || '#00D4FF';
                          return (
                            <span
                              key={k}
                              className="chip text-[9px] font-mono py-0 h-4"
                              style={{
                                backgroundColor: `${col}18`,
                                borderColor: `${col}44`,
                                color: col,
                              }}
                            >
                              {STRATEGY_LABELS[k as keyof typeof STRATEGY_LABELS]} · {v as number}
                            </span>
                          );
                        })}
                    </div>
                    {st.worstTask && (
                      <button
                        className="mt-1.5 text-[10px] text-steel-400 hover:text-steel-cyan flex items-center gap-1 font-mono w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectTask(st.worstTask!);
                          setSearchPanelOpen(true);
                          if (!highlightedTaskIds.includes(st.worstTask!)) toggleHighlight(st.worstTask!);
                        }}
                      >
                        <AlertTriangle className="w-2.5 h-2.5 text-steel-red" />
                        定位最异常任务：{st.worstTask}
                        <ChevronRight className="w-2.5 h-2.5 ml-auto" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StrategyCompareChart() {
  const { strategyCompare } = useAppStore();

  const chartData = useMemo(() => {
    return strategyCompare.map((s) => ({
      name: STRATEGY_LABELS[s.strategy],
      平均路径米: s.avgDistance,
      耗时分钟: Math.round((s.avgDuration / 60) * 10) / 10,
      回头率: s.revisitRate,
      任务量: s.taskCount,
      color: STRATEGY_COLORS[s.strategy],
    }));
  }, [strategyCompare]);

  return (
    <div>
      <div className="section-title flex items-center gap-1.5">
        <BarChart3 className="w-3 h-3" />
        策略对比
      </div>
      <div className="section-underline" />
      <div className="bg-space-850/40 border border-white/10 rounded-lg p-2">
        {chartData.length === 0 ? (
          <div className="text-[11px] text-slate-500 text-center py-8">暂无数据</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Inter' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,22,40,0.95)',
                    border: '1px solid rgba(0,212,255,0.25)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'Inter',
                  }}
                  labelStyle={{ color: '#00D4FF', fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', paddingTop: 4 }}
                  iconType="circle"
                />
                <Bar dataKey="平均路径米" fill="#00D4FF" radius={[3, 3, 0, 0]} barSize={16} />
                <Bar dataKey="耗时分钟" fill="#FFC93C" radius={[3, 3, 0, 0]} barSize={16} />
                <Bar dataKey="回头率" fill="#B794F4" radius={[3, 3, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2">
              {chartData.map((row) => (
                <div
                  key={row.name}
                  className="rounded-md p-2 border text-center"
                  style={{
                    borderColor: `${row.color}33`,
                    background: `${row.color}08`,
                  }}
                >
                  <div className="text-[9px] text-slate-400">{row.name}</div>
                  <div
                    className="text-[13px] font-bold font-mono-num"
                    style={{ color: row.color, textShadow: `0 0 8px ${row.color}44` }}
                  >
                    {row.任务量}
                  </div>
                  <div className="text-[9px] text-slate-500">单任务</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskTrendMini() {
  const { tasks, timeRange } = useAppStore();
  const data = useMemo(() => {
    const buckets: Record<string, number> = {};
    const start = new Date(timeRange.start).getTime();
    const span = new Date(timeRange.end).getTime() - start;
    const step = Math.max(3600000, span / 12);
    tasks.forEach((t) => {
      const ts = new Date(t.startTime).getTime();
      const b = Math.floor((ts - start) / step);
      buckets[b] = (buckets[b] || 0) + 1;
    });
    const arr: { t: string; count: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(start + i * step);
      arr.push({
        t: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        count: buckets[i] || 0,
      });
    }
    return arr;
  }, [tasks, timeRange]);

  return (
    <div>
      <div className="section-title flex items-center gap-1.5">
        <Activity className="w-3 h-3" />
        任务时段分布
      </div>
      <div className="section-underline" />
      <div className="bg-space-850/40 border border-white/10 rounded-lg p-2">
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="grad-trend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
            <XAxis
              dataKey="t"
              tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,22,40,0.95)',
                border: '1px solid rgba(0,212,255,0.25)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#00D4FF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#00D4FF', stroke: '#0A1628', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RightPanel() {
  return (
    <div className="absolute right-3 top-16 bottom-20 w-[310px] panel p-3.5 flex flex-col gap-4 z-10 scrollbar-thin overflow-y-auto">
      <KPICards />
      <TaskTrendMini />
      <CongestionList />
      <StrategyCompareChart />
    </div>
  );
}
