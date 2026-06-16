import {
  Boxes,
  Tag,
  Route,
  Flame,
  User,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gauge,
  Maximize2,
  Camera,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { LayersState, HeatMode } from '@/types';

const LAYER_ICONS: Record<keyof LayersState, typeof Boxes> = {
  warehouse: Boxes,
  rackLabels: Tag,
  paths: Route,
  heat: Flame,
  pickers: User,
};

const LAYER_LABELS: Record<keyof LayersState, string> = {
  warehouse: '库区结构',
  rackLabels: '货架编号',
  paths: '任务路径',
  heat: '热度网格',
  pickers: '拣货员位置',
};

const SPEEDS: (0.5 | 1 | 2 | 4)[] = [0.5, 1, 2, 4];

function formatClock(totalSeconds: number, progress: number) {
  const s = Math.max(0, Math.floor(totalSeconds * progress));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function LeftPanel() {
  const {
    layers,
    toggleLayer,
    heatOpacity,
    setHeatOpacity,
    heatMode,
    setHeatMode,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    playbackProgress,
    setPlaybackProgress,
    selectedTaskId,
    tasks,
    selectTask,
  } = useAppStore();

  const selectedTask = tasks.find((t) => t.taskId === selectedTaskId) ?? null;
  const totalDur = selectedTask?.totalDuration ?? 300;

  const seek = (delta: number) => {
    setPlaybackProgress(Math.max(0, Math.min(1, playbackProgress + delta)));
  };

  return (
    <div className="absolute left-3 top-16 bottom-20 w-[270px] panel p-3.5 flex flex-col gap-4 z-10 scrollbar-thin overflow-y-auto">
      <div>
        <div className="section-title">图层控制</div>
        <div className="section-underline" />
        <div className="space-y-1.5">
          {(Object.keys(layers) as (keyof LayersState)[]).map((k) => {
            const Icon = LAYER_ICONS[k];
            const active = layers[k];
            return (
              <button
                key={k}
                onClick={() => toggleLayer(k)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-200 ${
                  active
                    ? 'bg-steel-cyan/10 border-steel-cyan/35 text-steel-cyan'
                    : 'bg-space-850/40 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-md flex items-center justify-center border transition-all ${
                    active
                      ? 'bg-steel-cyan/15 border-steel-cyan/40 shadow-glow-sm'
                      : 'bg-space-800/60 border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 text-left text-xs font-medium">{LAYER_LABELS[k]}</div>
                <span
                  className={`w-9 h-5 rounded-full relative transition-all duration-200 ${
                    active ? 'bg-steel-cyan/40' : 'bg-space-700/80'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                      active ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="section-title flex items-center justify-between">
          <span>热度渲染</span>
          <span className="text-[9px] text-slate-500 normal-case tracking-normal">{Math.round(heatOpacity * 100)}%</span>
        </div>
        <div className="section-underline" />
        <div className="space-y-2.5">
          <div className="flex gap-1.5">
            {(['planar', 'volumetric'] as HeatMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setHeatMode(m)}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                  heatMode === m
                    ? 'bg-steel-cyan/15 border-steel-cyan/40 text-steel-cyan'
                    : 'bg-space-850/60 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'planar' ? '贴地模式' : '立体模式'}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={heatOpacity}
            onChange={(e) => setHeatOpacity(Number(e.target.value))}
            className="range-slider w-full"
          />
        </div>
      </div>

      <div>
        <div className="section-title flex items-center gap-1.5">
          <Gauge className="w-3 h-3" />
          路径回放
        </div>
        <div className="section-underline" />
        {selectedTask ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500">当前任务</div>
                <div className="text-xs font-mono-num text-steel-cyan">{selectedTask.taskId}</div>
              </div>
              <button
                onClick={() => selectTask(null)}
                className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-400 hover:text-steel-red hover:border-steel-red/40 transition-colors"
              >
                清除
              </button>
            </div>

            <div className="bg-space-850/60 rounded-lg p-2.5 border border-white/10">
              <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400 mb-1">
                <span>00:00:00</span>
                <span className="text-steel-cyan font-semibold">
                  {formatClock(totalDur, playbackProgress)}
                </span>
                <span>{formatClock(totalDur, 1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={playbackProgress}
                onChange={(e) => setPlaybackProgress(Number(e.target.value))}
                className="range-slider w-full"
              />
            </div>

            <div className="flex items-center justify-between gap-1.5">
              <button
                onClick={() => seek(-10 / totalDur)}
                className="btn-icon"
                title="后退10秒"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 font-semibold text-sm transition-all"
                style={{
                  background: isPlaying
                    ? 'linear-gradient(135deg, #00D4FF22, #B794F422)'
                    : 'linear-gradient(135deg, #00D4FF33, #B794F433)',
                  border: `1px solid ${isPlaying ? '#00D4FF55' : '#00D4FF66'}`,
                  color: isPlaying ? '#FFC93C' : '#00D4FF',
                  boxShadow: isPlaying ? '0 0 15px #00D4FF33' : '0 0 12px #00D4FF44',
                }}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" /> 暂停
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> 播放
                  </>
                )}
              </button>
              <button
                onClick={() => seek(10 / totalDur)}
                className="btn-icon"
                title="前进10秒"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`py-1 rounded text-[11px] font-mono-num border transition-all ${
                    playbackSpeed === s
                      ? 'bg-steel-yellow/15 border-steel-yellow/40 text-steel-yellow'
                      : 'bg-space-850/60 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-5 text-slate-500 text-xs border border-dashed border-white/10 rounded-lg bg-space-850/30">
            <Route className="w-6 h-6 mx-auto mb-1.5 text-slate-600" />
            点击场景中的路径或任务<br />即可进入回放模式
          </div>
        )}
      </div>

      <div>
        <div className="section-title flex items-center gap-1.5">
          <Camera className="w-3 h-3" />
          视角预设
        </div>
        <div className="section-underline" />
        <div className="grid grid-cols-2 gap-1.5">
          <button className="py-1.5 rounded-md text-[11px] font-medium border bg-space-850/60 border-white/10 text-slate-300 hover:border-steel-cyan/40 hover:text-steel-cyan transition-all flex items-center justify-center gap-1">
            <Maximize2 className="w-3 h-3" /> 全局视角
          </button>
          <button className="py-1.5 rounded-md text-[11px] font-medium border bg-space-850/60 border-white/10 text-slate-300 hover:border-steel-cyan/40 hover:text-steel-cyan transition-all flex items-center justify-center gap-1">
            <Camera className="w-3 h-3" /> 俯视平面
          </button>
        </div>
      </div>
    </div>
  );
}
