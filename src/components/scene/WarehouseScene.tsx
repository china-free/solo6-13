import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Suspense, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { WarehouseGround } from './WarehouseGround';
import { WarehouseRacks } from './WarehouseRacks';
import { TaskPaths } from './TaskPaths';
import { HeatOverlay } from './HeatOverlay';
import { PlaybackAgents } from './PlaybackAgents';
import { ZoneLabels } from './ZoneLabels';

export function WarehouseScene() {
  const { structure } = useAppStore();
  const halfW = (structure?.groundSize.width ?? 30) / 2;
  const halfD = (structure?.groundSize.depth ?? 20) / 2;

  const cameraPos = useMemo(() => new THREE.Vector3(halfW * 1.4, 22, halfD * 2.1), [halfW, halfD]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: cameraPos, fov: 45, near: 0.1, far: 500 }}
      gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2(0x050B18, 0.018);
        scene.background = new THREE.Color(0x050B18);
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.45} color={'#9fb4d9'} />
        <directionalLight
          position={[15, 25, 18]}
          intensity={1.1}
          color={'#a8c4ff'}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-halfW - 5}
          shadow-camera-right={halfW + 5}
          shadow-camera-top={halfD + 5}
          shadow-camera-bottom={-halfD - 5}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
        />
        <pointLight position={[-halfW, 8, -halfD]} intensity={0.4} color={'#00D4FF'} distance={40} decay={1.8} />
        <pointLight position={[halfW, 8, halfD]} intensity={0.4} color={'#B794F4'} distance={40} decay={1.8} />
        <pointLight position={[0, 10, 0]} intensity={0.3} color={'#ffffff'} distance={35} decay={2} />

        <Stars radius={120} depth={40} count={2000} factor={3} saturation={0} fade speed={0.25} />

        <WarehouseGround />
        <WarehouseRacks />
        <ZoneLabels />
        <TaskPaths />
        <HeatOverlay />
        <PlaybackAgents />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={6}
          maxDistance={80}
          minPolarAngle={Math.PI / 9}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 1, 0]}
        />

        <EffectComposer enableNormalPass={false}>
          <FXAA />
          <Bloom
            luminanceThreshold={0.55}
            luminanceSmoothing={0.9}
            intensity={0.55}
            mipmapBlur
            radius={0.6}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
