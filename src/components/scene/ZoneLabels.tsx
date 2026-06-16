import { Html } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';

export function ZoneLabels() {
  const { structure, layers } = useAppStore();
  if (!structure || !layers.warehouse) return null;
  return (
    <group>
      {structure.zones.map((z) => {
        const cx = z.bounds.x + z.bounds.w / 2;
        const cz = z.bounds.z + z.bounds.d / 2;
        return (
          <group key={z.id}>
            <Html
              position={[cx, 0.12, cz]}
              center
              distanceFactor={10}
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="px-3 py-0.5 text-[11px] font-bold tracking-[0.3em] rounded-full border shadow-glow-sm"
                style={{
                  backgroundColor: `${z.color}18`,
                  borderColor: `${z.color}55`,
                  color: z.color,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {z.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
