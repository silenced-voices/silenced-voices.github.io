'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { Edges, MeshReflectorMaterial, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, Eye, MousePointer2, Volume2, VolumeX, X } from 'lucide-react';

type Work = {
  id: number;
  room: 0 | 1;
  kicker: string;
  title: string;
  image: string;
  summary: string;
  pull: string;
  position: [number, number, number];
  rotation: number;
  size: [number, number];
};

const works: Work[] = [
  {
    id: 1,
    room: 0,
    kicker: '00 · Prologue',
    title: 'Silenced Voices',
    image: '/chapter-0/page-01.jpg',
    summary: 'A visual inquiry into aphasia, family care, and the right to expression. The exhibition begins with the person behind the research: a grandmother whose thoughts remained present even when language became difficult to reach.',
    pull: 'A missing response is not evidence of a missing thought.',
    position: [-3.6, 2.55, 3.1],
    rotation: 0.28,
    size: [2.2, 3.12],
  },
  {
    id: 2,
    room: 0,
    kicker: '00 · A personal beginning',
    title: 'My Grandma Still Had Something to Say',
    image: '/chapter-0/page-02.jpg',
    summary: 'Unable to speak was never the same as silent. Small gestures, fragments of language, and familiar objects carried needs that family members were still learning to understand.',
    pull: 'Her needs remained; our ability to understand them had changed.',
    position: [3.35, 2.45, -3.4],
    rotation: -0.3,
    size: [3.65, 2.58],
  },
  {
    id: 3,
    room: 1,
    kicker: '01 · The opening question',
    title: 'Who is losing a voice?',
    image: '/chapter-1/page-03.jpg',
    summary: 'Aphasia does not interrupt only one person’s language. It changes how a family speaks, transfers the work of interpretation, and exposes the pressures carried by the people rebuilding communication.',
    pull: 'They are not people without voices. Their voices are struggling to reach others.',
    position: [-3.5, 2.45, -15.5],
    rotation: 0.3,
    size: [3.7, 2.62],
  },
  {
    id: 4,
    room: 1,
    kicker: '01 · The patient',
    title: 'Aphasia is not a refusal to speak',
    image: '/chapter-1/page-04.jpg',
    summary: 'Aphasia is an acquired communication disorder caused by damage to the brain’s language system. It may affect speaking, understanding, reading, or writing. A missing response is not evidence of a missing thought.',
    pull: 'The thought remains. The exit is obstructed.',
    position: [3.45, 2.5, -22.2],
    rotation: -0.28,
    size: [3.7, 2.62],
  },
  {
    id: 5,
    room: 1,
    kicker: '01 · Care and rehabilitation',
    title: 'The work around a voice',
    image: '/chapter-1/page-05.jpg',
    summary: 'Relatives become interpreters, record keepers, exercise partners, and advocates. Clinicians assess, observe, adjust, and guide. Communication depends on sustained attention from both sides of the exchange.',
    pull: 'Speaking for someone. Struggling to be heard. Small changes. Demanding work.',
    position: [-3.25, 2.45, -29.1],
    rotation: 0.26,
    size: [3.7, 2.62],
  },
];

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function ArtPanel({ work, active, onSelect }: { work: Work; active: boolean; onSelect: (work: Work) => void }) {
  const texture = useTexture(work.image);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'default';
    return () => { document.body.style.cursor = 'default'; };
  }, [hovered]);

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 6) return;
    onSelect(work);
  };

  return (
    <group position={work.position} rotation={[0, work.rotation, 0]}>
      <mesh position={[0, 0, -0.08]} onClick={select}>
        <boxGeometry args={[work.size[0] + 0.18, work.size[1] + 0.18, 0.14]} />
        <meshStandardMaterial color="#0a0a09" roughness={0.5} metalness={0.45} />
        <Edges color={active || hovered ? '#ded8ca' : '#57544e'} threshold={15} />
      </mesh>
      <mesh
        position={[0, 0, 0.008]}
        onClick={select}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={work.size} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.2, 1.4]} color="#fff4dc" intensity={active || hovered ? 3.2 : 1.25} distance={7} decay={2} />
      <mesh position={[0, -work.size[1] / 2 - 0.22, -0.01]}>
        <boxGeometry args={[1.25, 0.08, 0.04]} />
        <meshBasicMaterial color={active ? '#d7d1c4' : '#4d4a45'} />
      </mesh>
    </group>
  );
}

function Portal() {
  return (
    <group position={[0, 0, -10.2]}>
      <mesh position={[-4.05, 2.75, 0]}>
        <boxGeometry args={[4.1, 5.5, 0.32]} />
        <meshStandardMaterial color="#070707" roughness={0.82} metalness={0.08} />
        <Edges color="#383734" />
      </mesh>
      <mesh position={[4.05, 2.75, 0]}>
        <boxGeometry args={[4.1, 5.5, 0.32]} />
        <meshStandardMaterial color="#070707" roughness={0.82} metalness={0.08} />
        <Edges color="#383734" />
      </mesh>
      <mesh position={[0, 5.15, 0]}>
        <boxGeometry args={[4, 0.7, 0.32]} />
        <meshStandardMaterial color="#070707" roughness={0.82} />
        <Edges color="#44413d" />
      </mesh>
      <mesh position={[-1.95, 2.65, 0.18]}>
        <boxGeometry args={[0.08, 5.2, 0.08]} />
        <meshBasicMaterial color="#f3eee1" />
      </mesh>
      <mesh position={[1.95, 2.65, 0.18]}>
        <boxGeometry args={[0.08, 5.2, 0.08]} />
        <meshBasicMaterial color="#f3eee1" />
      </mesh>
      <pointLight position={[0, 2.7, -0.8]} color="#f6ead2" intensity={5} distance={8} decay={2} />
    </group>
  );
}

function Architecture() {
  const ribs = [6, 1.5, -3, -7.2, -14.2, -19.4, -24.6, -29.8, -35];
  return (
    <>
      <fog attach="fog" args={['#020202', 8, 44]} />
      <ambientLight intensity={0.32} color="#d8d3c7" />
      <directionalLight position={[0, 7, 7]} intensity={1.1} color="#e7dfcf" />
      <pointLight position={[0, 4.6, -18]} intensity={2.5} color="#91887a" distance={24} decay={2} />

      <mesh position={[0, -0.08, -14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 52]} />
        <MeshReflectorMaterial
          blur={[280, 95]}
          resolution={512}
          mixBlur={1.1}
          mixStrength={1.8}
          roughness={0.72}
          depthScale={0.8}
          minDepthThreshold={0.25}
          maxDepthThreshold={1.25}
          color="#060606"
          metalness={0.45}
          mirror={0.38}
        />
      </mesh>
      <gridHelper args={[52, 52, '#4a4945', '#151515']} position={[0, 0.015, -14]} />
      <gridHelper args={[52, 52, '#383733', '#111111']} position={[0, 5.5, -14]} />
      <gridHelper args={[52, 52, '#393834', '#111111']} position={[-6, 2.75, -14]} rotation={[0, 0, Math.PI / 2]} />
      <gridHelper args={[52, 52, '#393834', '#111111']} position={[6, 2.75, -14]} rotation={[0, 0, Math.PI / 2]} />

      {ribs.map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[-5.82, 2.75, 0]}><boxGeometry args={[0.06, 5.5, 0.06]} /><meshBasicMaterial color="#4a4945" /></mesh>
          <mesh position={[5.82, 2.75, 0]}><boxGeometry args={[0.06, 5.5, 0.06]} /><meshBasicMaterial color="#4a4945" /></mesh>
          <mesh position={[0, 5.36, 0]}><boxGeometry args={[11.7, 0.06, 0.06]} /><meshBasicMaterial color="#43413d" /></mesh>
        </group>
      ))}

      <Portal />
      <mesh position={[0, 2.75, -36.2]}>
        <boxGeometry args={[12, 5.5, 0.35]} />
        <meshStandardMaterial color="#050505" roughness={0.86} />
        <Edges color="#353431" />
      </mesh>
      <Sparkles count={120} scale={[11, 5.2, 47]} position={[0, 2.8, -14]} size={1.35} speed={0.08} opacity={0.42} color="#d6d2c8" />
    </>
  );
}

function CameraRig({ progress, look }: { progress: number; look: { x: number; y: number } }) {
  useFrame(({ camera }, delta) => {
    const doorway = Math.exp(-Math.pow((progress - 0.466) / 0.075, 2));
    const targetZ = THREE.MathUtils.lerp(8.2, -32.4, progress);
    const targetX = Math.sin(progress * Math.PI * 3.2) * 0.14;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5.5, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.68 + doorway * 0.06, 4, delta);

    const yaw = THREE.MathUtils.degToRad(look.x);
    const pitch = THREE.MathUtils.degToRad(look.y);
    camera.lookAt(
      camera.position.x + Math.sin(yaw) * 12,
      camera.position.y + Math.sin(pitch) * 10,
      camera.position.z - Math.cos(yaw) * 12,
    );

    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const targetFov = 56 + doorway * 8;
    if (Math.abs(perspectiveCamera.fov - targetFov) > 0.02) {
      perspectiveCamera.fov = THREE.MathUtils.damp(perspectiveCamera.fov, targetFov, 5, delta);
      perspectiveCamera.updateProjectionMatrix();
    }
  });
  return null;
}

function ExhibitionScene({ progress, look, activeWork, onSelect }: { progress: number; look: { x: number; y: number }; activeWork: number; onSelect: (work: Work) => void }) {
  return (
    <Canvas dpr={[1, 1.7]} camera={{ position: [0, 1.68, 8.2], fov: 56, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#020202']} />
      <Suspense fallback={null}>
        <Architecture />
        {works.map((work) => <ArtPanel key={work.id} work={work} active={work.id === activeWork} onSelect={onSelect} />)}
      </Suspense>
      <CameraRig progress={progress} look={look} />
    </Canvas>
  );
}

export default function Home() {
  const [mode, setMode] = useState<'ask' | 'space' | 'page'>('ask');
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState<Work | null>(null);
  const [sound, setSound] = useState(false);
  const [help, setHelp] = useState(true);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; lastY: number; pointerType: string; baseX: number; baseY: number } | null>(null);

  const currentRoom = progress < 0.47 ? 0 : 1;
  const transitioning = progress > 0.405 && progress < 0.54;
  const cameraZ = THREE.MathUtils.lerp(8.2, -32.4, progress);
  const nearest = works.reduce((best, work) => (
    Math.abs(work.position[2] - cameraZ) < Math.abs(best.position[2] - cameraZ) ? work : best
  ), works[0]);

  const walkTo = (next: number) => setProgress(clamp(next));
  const jumpToRoom = (room: 0 | 1) => walkTo(room === 0 ? 0.05 : 0.53);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDetail(null); setHelp(false); }
      if (mode !== 'space' || detail) return;
      if (['ArrowDown', 'ArrowRight', 's', 'd'].includes(event.key.toLowerCase())) walkTo(progress + 0.055);
      if (['ArrowUp', 'ArrowLeft', 'w', 'a'].includes(event.key.toLowerCase())) walkTo(progress - 0.055);
      if (event.key === 'Enter') setDetail(nearest);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, mode, nearest, progress]);

  const beginDrag = (event: React.PointerEvent) => {
    drag.current = { x: event.clientX, y: event.clientY, lastY: event.clientY, pointerType: event.pointerType, baseX: look.x, baseY: look.y };
  };
  const moveDrag = (event: React.PointerEvent) => {
    if (!drag.current) return;
    if (drag.current.pointerType === 'touch') {
      const delta = drag.current.lastY - event.clientY;
      drag.current.lastY = event.clientY;
      walkTo(progress + delta * 0.0018);
      setLook((value) => ({ ...value, x: clamp(drag.current!.baseX + (event.clientX - drag.current!.x) / 8, -12, 12) }));
      return;
    }
    setLook({
      x: clamp(drag.current.baseX + (event.clientX - drag.current.x) / 10, -13, 13),
      y: clamp(drag.current.baseY - (event.clientY - drag.current.y) / 13, -7, 7),
    });
  };
  const endDrag = () => { drag.current = null; };
  const walk = (event: React.WheelEvent) => {
    event.preventDefault();
    walkTo(progress + clamp(event.deltaY, -180, 180) * 0.00058);
  };

  if (mode === 'ask') return (
    <main className="threshold">
      <div className="threshold-mark" aria-hidden="true"><span /><span /><span /></div>
      <p className="eyebrow">Silenced Voices · Chapters 00–01</p>
      <h1>Enter the<br />exhibition</h1>
      <p className="threshold-intro">Walk from a personal beginning into the first chapter of an exhibition about aphasia, care, and the right to be understood.</p>
      <div className="mode-grid" aria-label="Choose how to visit">
        <button onClick={() => setMode('space')}><span className="mode-title">Space</span><span>Scroll through two connected rooms</span></button>
        <button onClick={() => setMode('page')}><span className="mode-title">Page</span><span>The quiet editorial · reads like print</span></button>
      </div>
      <p className="threshold-note">Scroll to walk · drag to look · click a work to enter</p>
    </main>
  );

  if (mode === 'page') return (
    <main className="reading-mode">
      <header className="reading-header"><button className="wordmark" onClick={() => setMode('ask')}>Silenced Voices</button><span>Chapters 00–01 · 05 works</span><button onClick={() => setMode('space')}>Space view</button></header>
      <section className="reading-hero"><p>00–01</p><h1>From a personal beginning to the question of voice.</h1><blockquote>“A missing response is not evidence of a missing thought.”</blockquote></section>
      <div className="reading-list">{works.map((work) => <article key={work.id}><div className="reading-copy"><p className="eyebrow">{work.kicker}</p><h2>{work.title}</h2><p>{work.summary}</p><blockquote>{work.pull}</blockquote></div><button className="board-button" onClick={() => setDetail(work)} aria-label={`Open ${work.title}`}><img src={work.image} alt={`Original exhibition board: ${work.title}`} /></button></article>)}</div>
      <Detail work={detail} close={() => setDetail(null)} />
    </main>
  );

  return (
    <main className={`space-mode room-${currentRoom} ${transitioning ? 'is-transitioning' : ''}`}>
      <section
        className="room-viewport"
        aria-label="Interactive 3D exhibition. Scroll to walk, drag to look, and click a mounted work to view it full screen."
        onWheel={walk}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <ExhibitionScene progress={progress} look={look} activeWork={nearest.id} onSelect={setDetail} />
      </section>

      <header className="space-header">
        <button className="wordmark" onClick={() => setMode('ask')}>Silenced <i>Voices</i></button>
        <span>{currentRoom === 0 ? 'Room 00 / Prologue' : 'Room 01 / Who is losing a voice?'}</span>
        <button onClick={() => setMode('page')}>Menu</button>
      </header>

      <nav className="chapter-nav" aria-label="Exhibition rooms">
        <button className={currentRoom === 0 ? 'active' : ''} onClick={() => jumpToRoom(0)}>00 <span>Prologue</span></button>
        <button className={currentRoom === 1 ? 'active' : ''} onClick={() => jumpToRoom(1)}>01 <span>Who is losing a voice?</span></button>
      </nav>

      <div className="space-caption"><span>{String(nearest.id).padStart(2, '0')}</span><div><p>{nearest.kicker}</p><h1>{nearest.title}</h1><button onClick={() => setDetail(nearest)}>View full image</button></div></div>
      <div className="walk-instruction">Scroll to walk · Drag to look · Click a work to enter</div>
      <div className="walk-progress" aria-hidden="true"><span style={{ width: `${Math.max(2, progress * 100)}%` }} /></div>

      <button className="nav-arrow prev" disabled={progress <= 0} onClick={() => walkTo(progress - 0.12)} aria-label="Walk backward"><ArrowLeft /></button>
      <button className="nav-arrow next" disabled={progress >= 1} onClick={() => walkTo(progress + 0.12)} aria-label="Walk forward"><ArrowRight /></button>

      <nav className="utility-nav" aria-label="Room controls"><button onClick={() => setHelp(!help)}><MousePointer2 /> Controls</button><button onClick={() => setSound(!sound)}>{sound ? <Volume2 /> : <VolumeX />} {sound ? 'Sound' : 'Quiet'}</button><button onClick={() => setMode('page')}><Eye /> Space / Page</button></nav>
      {help && <aside className="control-card"><button onClick={() => setHelp(false)} aria-label="Close controls"><X /></button><p>Scroll to walk · drag to look</p><strong>Pass through the lit doorway to enter Chapter 01.</strong><span>Click any mounted page to view it full screen.</span></aside>}

      <div className="room-transition" aria-hidden={!transitioning}>
        <p>Entering</p><strong>01</strong><span>Who is losing a voice?</span>
      </div>
      <div className="door-flare" />
      <Detail work={detail} close={() => setDetail(null)} />
    </main>
  );
}

function Detail({ work, close }: { work: Work | null; close: () => void }) {
  if (!work) return null;
  const index = works.findIndex((item) => item.id === work.id);
  return (
    <div className="detail-backdrop" role="dialog" aria-modal="true" aria-label={work.title}>
      <button className="detail-close" onClick={close} aria-label="Close exhibit"><X /></button>
      <article className="detail-copy"><p className="eyebrow">{work.kicker}</p><h2>{work.title}</h2><p>{work.summary}</p><blockquote>{work.pull}</blockquote><span className="detail-count">{String(index + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}</span></article>
      <div className="detail-board"><img src={work.image} alt={`Full exhibition board: ${work.title}`} /></div>
    </div>
  );
}
