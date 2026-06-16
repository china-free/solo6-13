import { useEffect } from 'react';
import { Loader2, AlertCircle, Database } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { WarehouseScene } from '@/components/scene/WarehouseScene';
import { TopBar } from '@/components/ui/TopBar';
import { LeftPanel } from '@/components/ui/LeftPanel';
import { RightPanel } from '@/components/ui/RightPanel';
import { BottomDrawer } from '@/components/ui/BottomDrawer';

export default function Home() {
  const { fetchStructure, fetchAll, structure, loading, error } = useAppStore();

  useEffect(() => {
    void (async () => {
      if (!structure) await fetchStructure();
      await fetchAll();
    })();
  }, []);

  const ready = !!structure;

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-0">
        <WarehouseScene />
      </div>

      {!ready && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-space-950/85 backdrop-blur-sm">
          <div className="text-center">
            <div className="relative mx-auto w-20 h-20 mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-steel-cyan/20" />
              <div className="absolute inset-0 rounded-full border-2 border-t-steel-cyan animate-spin" />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-steel-cyan/30 to-steel-purple/20 flex items-center justify-center">
                <Database className="w-7 h-7 text-steel-cyan animate-pulse" />
              </div>
            </div>
            <div className="text-lg font-semibold text-white mb-1 tracking-wide">
              WareViz 正在初始化库区数据
            </div>
            <div className="text-xs text-slate-400 font-mono-num flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-steel-cyan" />
              加载 3D 场景 · 生成轨迹 · 计算热度...
            </div>
          </div>
        </div>
      )}

      {ready && (
        <>
          <TopBar />
          <LeftPanel />
          <RightPanel />
          <BottomDrawer />
        </>
      )}

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 panel px-4 py-2.5 flex items-center gap-2 border-steel-red/40 shadow-glow-sm">
          <AlertCircle className="w-4 h-4 text-steel-red" />
          <span className="text-xs text-slate-200">{error}</span>
        </div>
      )}

      {ready && (
        <div className="absolute bottom-3 left-[300px] z-10 pointer-events-none flex items-center gap-3 text-[10px] text-slate-500 font-mono-num">
          <span className="px-2 py-0.5 rounded bg-space-900/70 border border-white/10 backdrop-blur-sm">
            🖱️ 拖拽旋转 · 滚轮缩放 · 右键平移
          </span>
          <span className="px-2 py-0.5 rounded bg-space-900/70 border border-white/10 backdrop-blur-sm">
            💡 点击路径进入回放 · 点击货位查看详情
          </span>
        </div>
      )}

      {loading && ready && (
        <div className="absolute top-14 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-space-900/80 backdrop-blur-md border border-steel-cyan/30 shadow-glow-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-steel-cyan" />
          <span className="text-[11px] font-mono-num text-steel-cyan">同步数据中...</span>
        </div>
      )}
    </div>
  );
}
