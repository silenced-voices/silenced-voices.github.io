'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { Edges, MeshReflectorMaterial, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';

type Work = {
  id: string;
  label: string;
  sourcePage: number;
  cover: boolean;
  room: number;
  kicker: string;
  title: string;
  image: string;
  summary: string;
  pull: string;
  position: [number, number, number];
  rotation: number;
  size: [number, number];
};

type Chapter = { id: number; number: string; lastWorkZ: number };

type SceneProps = {
  progress: number;
  look: { x: number; y: number };
  activeWork: string;
  onSelect: (work: Work) => void;
  works: Work[];
  chapters: Chapter[];
  portalPositions: number[];
  pathStartZ: number;
  pathEndZ: number;
};

export function preloadArtwork(images: string[]) {
  images.forEach((image) => {
    try { useTexture.preload(image); } catch { /* native image warming still covers unsupported browsers */ }
  });
}

function ArtPanel({ work, active, onSelect }: { work: Work; active: boolean; onSelect: (work: Work) => void }) {
  const texture = useTexture(work.image);
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const frameMesh = useRef<THREE.Mesh>(null);
  const imageMesh = useRef<THREE.Mesh>(null);
  const coverLight = useRef<THREE.PointLight>(null);
  const fade = useRef(1);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'default';
    return () => { document.body.style.cursor = 'default'; };
  }, [hovered]);

  useFrame(({ camera }, delta) => {
    if (!work.cover || !group.current) return;
    const target = THREE.MathUtils.clamp((camera.position.z - work.position[2] - 2.0) / 1.15, 0, 1);
    fade.current = THREE.MathUtils.damp(fade.current, target, 18, delta);
    group.current.visible = fade.current > 0.012;
    const capturePointer = fade.current > 0.98;
    [frameMesh.current, imageMesh.current].forEach((mesh) => {
      if (mesh) mesh.raycast = capturePointer ? THREE.Mesh.prototype.raycast : () => undefined;
    });
    if (!capturePointer && hovered) setHovered(false);
    group.current.traverse((child) => {
      if (!(child instanceof THREE.Mesh || child instanceof THREE.LineSegments)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = fade.current;
        material.depthWrite = fade.current > 0.96;
      });
    });
    if (coverLight.current) coverLight.current.intensity = (active || hovered ? 3.2 : 1.15) * fade.current;
  });

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta <= 6) onSelect(work);
  };

  return (
    <group ref={group} position={work.position} rotation={[0, work.rotation, 0]}>
      <mesh ref={frameMesh} position={[0, 0, -0.08]} onClick={select}>
        <boxGeometry args={[work.size[0] + 0.18, work.size[1] + 0.18, 0.14]} />
        <meshStandardMaterial color="#0a0a09" roughness={0.5} metalness={0.45} />
        <Edges color={active || hovered ? '#ded8ca' : '#57544e'} threshold={15} />
      </mesh>
      <mesh ref={imageMesh} position={[0, 0, 0.008]} onClick={select} onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
        <planeGeometry args={work.size} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <pointLight ref={coverLight} position={[0, 1.2, 1.4]} color="#fff4dc" intensity={active || hovered ? 3.2 : 1.15} distance={7} decay={2} />
      <mesh position={[0, -work.size[1] / 2 - 0.22, -0.01]}><boxGeometry args={[1.25, 0.08, 0.04]} /><meshBasicMaterial color={active ? '#d7d1c4' : '#4d4a45'} /></mesh>
    </group>
  );
}

function PanelPlaceholder({ work, active }: { work: Work; active: boolean }) {
  return <group position={work.position} rotation={[0, work.rotation, 0]}>
    <mesh position={[0, 0, -0.08]}><boxGeometry args={[work.size[0] + 0.18, work.size[1] + 0.18, 0.14]} /><meshStandardMaterial color="#090908" roughness={0.6} metalness={0.35} /><Edges color={active ? '#ded8ca' : '#3d3b37'} threshold={15} /></mesh>
    <mesh position={[0, 0, 0.008]}><planeGeometry args={work.size} /><meshBasicMaterial color="#11110f" /></mesh>
    <mesh position={[0, -work.size[1] / 2 - 0.22, -0.01]}><boxGeometry args={[1.25, 0.08, 0.04]} /><meshBasicMaterial color="#4d4a45" /></mesh>
  </group>;
}

function Portal({ z }: { z: number }) {
  return <group position={[0, 0, z]}>
    <mesh position={[-4.05, 2.75, 0]}><boxGeometry args={[4.1, 5.5, 0.32]} /><meshStandardMaterial color="#070707" roughness={0.82} metalness={0.08} /><Edges color="#383734" /></mesh>
    <mesh position={[4.05, 2.75, 0]}><boxGeometry args={[4.1, 5.5, 0.32]} /><meshStandardMaterial color="#070707" roughness={0.82} metalness={0.08} /><Edges color="#383734" /></mesh>
    <mesh position={[0, 5.15, 0]}><boxGeometry args={[4, 0.7, 0.32]} /><meshStandardMaterial color="#070707" roughness={0.82} /><Edges color="#44413d" /></mesh>
    <mesh position={[-1.95, 2.65, 0.18]}><boxGeometry args={[0.08, 5.2, 0.08]} /><meshBasicMaterial color="#f3eee1" /></mesh>
    <mesh position={[1.95, 2.65, 0.18]}><boxGeometry args={[0.08, 5.2, 0.08]} /><meshBasicMaterial color="#f3eee1" /></mesh>
    <pointLight position={[0, 2.7, -0.8]} color="#f6ead2" intensity={5} distance={8} decay={2} />
  </group>;
}

function RoomDecor({ chapter }: { chapter: Chapter }) {
  const sculpture = useRef<THREE.Group>(null);
  const z = chapter.lastWorkZ - 2.15;
  const side = chapter.id % 2 === 0 ? 1 : -1;
  const accents = ['#c9c1ad', '#8d665f', '#79817a'];
  const accent = accents[chapter.id % accents.length];
  useFrame((_, delta) => {
    if (!sculpture.current) return;
    sculpture.current.rotation.y += delta * (chapter.id % 2 === 0 ? 0.12 : -0.12);
    sculpture.current.rotation.z += delta * 0.025;
  });
  return <group>
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.34, 0]}><boxGeometry args={[2.8, 0.13, 0.82]} /><meshStandardMaterial color="#11110f" roughness={0.42} metalness={0.58} /><Edges color="#5b5750" /></mesh>
      <mesh position={[-1.05, 0.15, 0]}><boxGeometry args={[0.09, 0.3, 0.58]} /><meshBasicMaterial color="#4a4741" /></mesh><mesh position={[1.05, 0.15, 0]}><boxGeometry args={[0.09, 0.3, 0.58]} /><meshBasicMaterial color="#4a4741" /></mesh>
      <mesh position={[0, 0.018, 0]}><boxGeometry args={[4.5, 0.018, 1.3]} /><meshBasicMaterial color={accent} transparent opacity={0.13} /></mesh>
      <mesh position={[-side * 2.2, 0.025, 0.55]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.82, 0.012, 6, 56]} /><meshBasicMaterial color={accent} transparent opacity={0.42} /></mesh>
      <mesh position={[-side * 2.2, 0.026, 0.55]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.18, 0.008, 6, 56]} /><meshBasicMaterial color="#ded8ca" transparent opacity={0.18} /></mesh>
    </group>
    <group position={[side * 4.72, 0, z - 1.25]}>
      <mesh position={[0, 0.62, 0]}><boxGeometry args={[1.08, 1.24, 1.08]} /><meshStandardMaterial color="#0b0b0a" roughness={0.35} metalness={0.68} transparent opacity={0.82} /><Edges color={accent} /></mesh>
      <group ref={sculpture} position={[0, 2.05, 0]}><mesh><torusGeometry args={[0.54, 0.024, 8, 56]} /><meshBasicMaterial color={accent} transparent opacity={0.78} /></mesh><mesh rotation={[Math.PI / 2, 0.35, 0]}><torusGeometry args={[0.37, 0.018, 8, 48]} /><meshBasicMaterial color="#ded8ca" transparent opacity={0.56} /></mesh><mesh rotation={[0.4, Math.PI / 2, 0.25]}><torusGeometry args={[0.7, 0.014, 8, 64]} /><meshBasicMaterial color={accent} transparent opacity={0.38} /></mesh><mesh><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#f1ece0" /></mesh></group>
      <pointLight position={[0, 1.65, 0.8]} color={accent} intensity={2.2} distance={5.5} decay={2} />
    </group>
    <group position={[-side * 5.15, 0, z + 1.8]}>{[0, 0.36, 0.72].map((offset, index) => <mesh key={offset} position={[offset * side, 2.1 + index * 0.36, 0]}><boxGeometry args={[0.035, 4.2 - index * 0.72, 0.035]} /><meshBasicMaterial color={index === 1 ? accent : '#6e6a62'} transparent opacity={0.72} /></mesh>)}<mesh position={[0.36 * side, 4.7, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshBasicMaterial color={accent} /></mesh></group>
    <group position={[-side * 3.7, 4.45, z - 0.7]} rotation={[0.18, side * 0.26, 0]}><mesh><octahedronGeometry args={[0.22, 1]} /><meshBasicMaterial color={accent} transparent opacity={0.82} /></mesh><mesh position={[0, -0.7, 0]}><cylinderGeometry args={[0.012, 0.012, 1.15, 8]} /><meshBasicMaterial color="#bdb5a8" transparent opacity={0.46} /></mesh><mesh position={[0, -1.32, 0]}><sphereGeometry args={[0.055, 10, 10]} /><meshBasicMaterial color="#eee7dc" /></mesh></group>
  </group>;
}

function Architecture({ chapters, portalPositions, pathStartZ, pathEndZ, compact }: Pick<SceneProps, 'chapters' | 'portalPositions' | 'pathStartZ' | 'pathEndZ'> & { compact: boolean }) {
  const centerZ = (pathStartZ + pathEndZ) / 2;
  const length = pathStartZ - pathEndZ + 16;
  const ribs = useMemo(() => Array.from({ length: Math.ceil(length / 4.6) }, (_, index) => pathStartZ - 4 - index * 4.6), [length, pathStartZ]);
  return <>
    <fog attach="fog" args={['#020202', 9, 46]} /><ambientLight intensity={0.3} color="#d8d3c7" /><directionalLight position={[0, 7, 7]} intensity={1.1} color="#e7dfcf" />
    <mesh position={[0, -0.08, centerZ]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, length]} /><MeshReflectorMaterial blur={[280, 95]} resolution={compact ? 192 : 384} mixBlur={1.1} mixStrength={1.8} roughness={0.72} depthScale={0.8} minDepthThreshold={0.25} maxDepthThreshold={1.25} color="#060606" metalness={0.45} mirror={0.38} /></mesh>
    <gridHelper args={[length, Math.ceil(length / 4), '#4a4945', '#151515']} position={[0, 0.015, centerZ]} /><gridHelper args={[length, Math.ceil(length / 4), '#383733', '#111111']} position={[0, 5.5, centerZ]} /><gridHelper args={[length, Math.ceil(length / 4), '#393834', '#111111']} position={[-6, 2.75, centerZ]} rotation={[0, 0, Math.PI / 2]} /><gridHelper args={[length, Math.ceil(length / 4), '#393834', '#111111']} position={[6, 2.75, centerZ]} rotation={[0, 0, Math.PI / 2]} />
    {ribs.map((z) => <group key={z} position={[0, 0, z]}><mesh position={[-5.82, 2.75, 0]}><boxGeometry args={[0.06, 5.5, 0.06]} /><meshBasicMaterial color="#4a4945" /></mesh><mesh position={[5.82, 2.75, 0]}><boxGeometry args={[0.06, 5.5, 0.06]} /><meshBasicMaterial color="#4a4945" /></mesh><mesh position={[0, 5.36, 0]}><boxGeometry args={[11.7, 0.06, 0.06]} /><meshBasicMaterial color="#43413d" /></mesh></group>)}
    {portalPositions.map((z) => <Portal key={z} z={z} />)}{chapters.map((chapter) => <RoomDecor key={chapter.number} chapter={chapter} />)}
    <mesh position={[0, 2.75, pathEndZ - 1]}><boxGeometry args={[12, 5.5, 0.35]} /><meshStandardMaterial color="#050505" roughness={0.86} /><Edges color="#353431" /></mesh><Sparkles count={compact ? 120 : 300} scale={[11, 5.2, length]} position={[0, 2.8, centerZ]} size={1.25} speed={0.07} opacity={0.36} color="#d6d2c8" />
  </>;
}

function CameraRig({ progress, look, portalPositions, pathStartZ, pathEndZ }: Pick<SceneProps, 'progress' | 'look' | 'portalPositions' | 'pathStartZ' | 'pathEndZ'>) {
  useFrame(({ camera }, delta) => {
    const targetZ = THREE.MathUtils.lerp(pathStartZ, pathEndZ, progress);
    const nearestPortal = Math.min(...portalPositions.map((z) => Math.abs(targetZ - z)));
    const doorway = Math.exp(-Math.pow(nearestPortal / 2.4, 2));
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5.5, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, Math.sin(progress * Math.PI * 13.8) * 0.12, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.62 + doorway * 0.07, 4, delta);
    const yaw = THREE.MathUtils.degToRad(look.x); const pitch = THREE.MathUtils.degToRad(look.y);
    camera.lookAt(camera.position.x + Math.sin(yaw) * 12, camera.position.y + Math.sin(pitch) * 10, camera.position.z - Math.cos(yaw) * 12);
    const perspectiveCamera = camera as THREE.PerspectiveCamera; const targetFov = 56 + doorway * 8;
    if (Math.abs(perspectiveCamera.fov - targetFov) > 0.02) { perspectiveCamera.fov = THREE.MathUtils.damp(perspectiveCamera.fov, targetFov, 5, delta); perspectiveCamera.updateProjectionMatrix(); }
  });
  return null;
}

export default function ExhibitionScene({ progress, look, activeWork, onSelect, works, chapters, portalPositions, pathStartZ, pathEndZ }: SceneProps) {
  const cameraZ = THREE.MathUtils.lerp(pathStartZ, pathEndZ, progress);
  const [compact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches);

  return <Canvas dpr={compact ? [1, 1] : [1, 1.4]} camera={{ position: [0, 2.62, pathStartZ], fov: 56, near: 0.1, far: 560 }} gl={{ antialias: !compact, powerPreference: 'high-performance' }} fallback={<div className="webgl-fallback" />}>
    <color attach="background" args={['#020202']} />
    <Architecture chapters={chapters} portalPositions={portalPositions} pathStartZ={pathStartZ} pathEndZ={pathEndZ} compact={compact} />
    {works.map((work) => <Suspense key={work.id} fallback={<PanelPlaceholder work={work} active={work.id === activeWork} />}><ArtPanel work={work} active={work.id === activeWork} onSelect={onSelect} /></Suspense>)}
    <CameraRig progress={progress} look={look} portalPositions={portalPositions} pathStartZ={pathStartZ} pathEndZ={pathEndZ} />
  </Canvas>;
}
