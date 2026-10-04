'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { Edges, MeshReflectorMaterial, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, Eye, MousePointer2, Volume2, VolumeX, X } from 'lucide-react';

type Chapter = {
  id: number;
  number: string;
  short: string;
  title: string;
  pages: number[];
  firstWorkZ: number;
  portalZ?: number;
};

type Work = {
  id: number;
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

const chapterSource = [
  { number: '00', short: 'Prologue', title: 'A Personal Beginning', pages: [1, 2] },
  { number: '01', short: 'Losing a Voice', title: 'Who Is Losing a Voice?', pages: [3, 4, 5] },
  { number: '02', short: 'The Lost Window', title: 'The Lost Window', pages: [6, 7] },
  { number: '03', short: 'Marginalized', title: 'The Marginalized Treatment', pages: [8, 9, 10] },
  { number: '04', short: 'History', title: 'History of Aphasia', pages: [11, 12] },
  { number: '05', short: 'Gentle Silence', title: 'The Gentle Silence', pages: [13, 14, 15] },
  { number: '06', short: 'Field Notes', title: 'Making Silence Visible', pages: [16, 17, 18, 19] },
  { number: '07', short: 'Rehabilitation', title: 'Rehabilitation', pages: [20] },
  { number: '08', short: 'SilentCare', title: 'SilentCare', pages: [21, 22, 23] },
  { number: '09', short: 'Expression', title: 'The Right to Expression', pages: [24, 25] },
  { number: '10', short: 'Learning to Wait', title: 'Learning How to Wait', pages: [26, 27] },
  { number: 'A', short: 'Appendix', title: 'Research Appendix', pages: [28, 29] },
];

const copy: Record<number, { title: string; summary: string; pull: string }> = {
  1: { title: 'Silenced Voices', summary: 'A visual inquiry into aphasia, family care, and the right to expression. The exhibition begins with the person behind the research: a grandmother whose thoughts remained present even when language became difficult to reach.', pull: 'A missing response is not evidence of a missing thought.' },
  2: { title: 'My Grandma Still Had Something to Say', summary: 'Unable to speak was never the same as silent. Small gestures, fragments of language, and familiar objects carried needs that family members were still learning to understand.', pull: 'Her needs remained; our ability to understand them had changed.' },
  3: { title: 'Who Is Losing a Voice?', summary: 'Aphasia does not interrupt only one person’s language. It changes how a family speaks, transfers the work of interpretation, and exposes the pressures carried by the people rebuilding communication.', pull: 'When a person loses language, what else is lost?' },
  4: { title: 'Aphasia Is Not a Refusal to Speak', summary: 'Aphasia is an acquired communication disorder caused by damage to the brain’s language system. It may affect speaking, understanding, reading, or writing.', pull: 'The thought remains. The exit is obstructed.' },
  5: { title: 'The Work Around a Voice', summary: 'Relatives become interpreters, record keepers, exercise partners, and advocates. Clinicians assess, observe, adjust, and guide.', pull: 'Communication depends on sustained attention from both sides.' },
  6: { title: 'The Lost Window', summary: 'Losing a voice is not an individual problem. The disruption spreads through care, recovery, family relationships, and everyday participation.', pull: 'A voice can disappear from public life long before it disappears from the person.' },
  7: { title: 'Two Timelines', summary: 'Clinical recovery follows appointments and discharge plans, while the need to communicate continues every hour at home.', pull: 'The need to communicate does not wait for therapy.' },
  8: { title: 'The Marginalized Treatment', summary: 'Language rehabilitation is often treated as secondary even though communication shapes autonomy, consent, relationships, and participation.', pull: 'What is difficult to measure can become easy to neglect.' },
  9: { title: 'A Step Can Be Seen', summary: 'Physical progress is visible. Communicative intention must be noticed, interpreted, and given time to arrive.', pull: 'A step can be seen. An intention must be understood.' },
  10: { title: 'How Exclusion Reinforces Itself', summary: 'Reduced support produces fewer opportunities to communicate, which can then be mistaken for reduced capacity or motivation.', pull: 'Public support must recognize the cycle, not only the symptom.' },
  11: { title: 'History of Aphasia', summary: 'The field moves from locating impairment in the brain toward understanding communication as a social and participatory experience.', pull: 'From localization to participation.' },
  12: { title: 'When Professional Care Recedes', summary: 'After formal services step back, families inherit a complicated system of observation, practice, advocacy, and emotional labor.', pull: 'The family becomes the system.' },
  13: { title: 'The Gentle Silence', summary: 'At the family table, care can become overprotection. Speaking for someone may feel efficient and kind while slowly reducing their opportunities to speak.', pull: 'Silence can be produced by love as well as neglect.' },
  14: { title: 'We Thought This Was Care', summary: 'A familiar domestic scene reveals how routines, assumptions, and time pressure reshape who gets to participate in conversation.', pull: 'Good intentions do not guarantee shared agency.' },
  15: { title: 'Fed, Warm, Medicated — Is That Enough?', summary: 'Practical care can meet physical needs while leaving expression, choice, and connection unattended. The caregiver can also become silent inside the burden.', pull: 'Care must include the right to be heard.' },
  16: { title: 'Making Silence Visible', summary: 'Fieldwork gathers the lived experience of patients, relatives, and rehabilitation professionals through interviews and observation.', pull: 'How were these voices collected?' },
  17: { title: 'Five Participants, Five Forms of Silence', summary: 'Five participant profiles show that aphasia is never a single story. Each voice is shaped by a different body, household, and support network.', pull: 'One diagnosis; many forms of silence.' },
  18: { title: 'A System Between Expertise and Capacity', summary: 'Recorded voices expose a system stretched between professional knowledge, limited resources, and the realities of care at home.', pull: 'Expertise exists. Capacity is uneven.' },
  19: { title: 'Scenes Without Sound', summary: 'Observed moments make absence legible: a pause at the table, an interrupted attempt, a need inferred before it can be expressed.', pull: 'The quietest scene may contain the most effort.' },
  20: { title: 'Rehabilitation', summary: 'Rehabilitation combines clinical process, training materials, repeated practice, and substantial invisible labor outside the clinic.', pull: 'Recovery continues between appointments.' },
  21: { title: 'SilentCare', summary: 'A wearable support system asks the surrounding people to slow down and preserve the space a person needs to complete an expression.', pull: 'Please wait. Let them finish.' },
  22: { title: 'Five Iterations Toward a Wearable System', summary: 'The concept develops through five physical iterations, testing visibility, comfort, signals, and the social meaning of wearing assistance.', pull: 'A tool should support the voice without replacing the person.' },
  23: { title: 'From Sensor Data to a Remote State', summary: 'Sensor input becomes a legible state in a caregiver application, creating a bridge between embodied effort and remote awareness.', pull: 'Make the need for time visible.' },
  24: { title: 'The Right to Expression', summary: 'Six changes a family can begin today reframe communication as a shared practice rather than a test the patient must pass.', pull: 'Expression is a right, not a reward for fluency.' },
  25: { title: 'Rehabilitation Should Not End at Discharge', summary: 'Students and communities can become part of a wider listening system, extending participation beyond the limits of formal care.', pull: 'A listening system can continue where a service ends.' },
  26: { title: 'Learning How to Wait', summary: 'The project returns from one family’s experience to the wider public issue: whether our environments leave enough time for difficult speech.', pull: 'Waiting is not passive. It is a form of care.' },
  27: { title: 'How Does a Voice Return?', summary: 'Before and after are not simply measures of fluency. A voice returns through confidence, participation, recognition, and time shared with others.', pull: 'A voice returns when someone is ready to receive it.' },
  28: { title: 'Interview Guide & Public Awareness Survey', summary: 'The research appendix documents the questions and survey structures used to gather experiences and public perceptions.', pull: 'Appendix A–B' },
  29: { title: 'Research Ethics & Evidence Register', summary: 'The final board records ethical safeguards, source material, assets, and the evidence structure supporting the project.', pull: 'Appendix C–D' },
};

const PAGE_SPACING = 5.9;
const PORTAL_GAP = 4.6;
let layoutCursor = 3.1;

const chapters: Chapter[] = chapterSource.map((source, chapterIndex) => {
  const firstWorkZ = layoutCursor;
  const lastWorkZ = firstWorkZ - (source.pages.length - 1) * PAGE_SPACING;
  const portalZ = chapterIndex < chapterSource.length - 1 ? lastWorkZ - PORTAL_GAP : undefined;
  layoutCursor = portalZ === undefined ? lastWorkZ : portalZ - PORTAL_GAP;
  return { ...source, id: chapterIndex, firstWorkZ, portalZ };
});

const works: Work[] = chapters.flatMap((chapter) => chapter.pages.map((page, index) => {
  const source = copy[page];
  const left = index % 2 === 0;
  return {
    id: page,
    room: chapter.id,
    kicker: `${chapter.number} · ${chapter.title}`,
    title: source.title,
    image: `/exhibition/page-${String(page).padStart(2, '0')}.jpg`,
    summary: source.summary,
    pull: source.pull,
    position: [left ? -3.5 : 3.5, page === 1 ? 2.55 : 2.45, chapter.firstWorkZ - index * PAGE_SPACING] as [number, number, number],
    rotation: left ? 0.27 : -0.27,
    size: page === 1 ? [2.2, 3.12] : [3.7, 2.62],
  };
}));

const PATH_START_Z = 8.2;
const PATH_END_Z = works[works.length - 1].position[2] - 4.2;
const PATH_LENGTH = PATH_START_Z - PATH_END_Z;
const portalPositions = chapters.slice(0, -1).map((chapter) => chapter.portalZ as number);
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const progressForZ = (z: number) => clamp((PATH_START_Z - z) / PATH_LENGTH);

function chapterForZ(z: number) {
  let room = 0;
  portalPositions.forEach((portal, index) => { if (z < portal) room = index + 1; });
  return room;
}

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
      <mesh position={[0, 0, 0.008]} onClick={select} onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
        <planeGeometry args={work.size} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.2, 1.4]} color="#fff4dc" intensity={active || hovered ? 3.2 : 1.15} distance={7} decay={2} />
      <mesh position={[0, -work.size[1] / 2 - 0.22, -0.01]}><boxGeometry args={[1.25, 0.08, 0.04]} /><meshBasicMaterial color={active ? '#d7d1c4' : '#4d4a45'} /></mesh>
    </group>
  );
}

function Portal({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[-4.05, 2.75, 0]}><boxGeometry args={[4.1, 5.5, 0.32]} /><meshStandardMaterial color="#070707" roughness={0.82} metalness={0.08} /><Edges color="#383734" /></mesh>
      <mesh position={[4.05, 2.75, 0]}><boxGeometry args={[4.1, 5.5, 0.32]} /><meshStandardMaterial color="#070707" roughness={0.82} metalness={0.08} /><Edges color="#383734" /></mesh>
      <mesh position={[0, 5.15, 0]}><boxGeometry args={[4, 0.7, 0.32]} /><meshStandardMaterial color="#070707" roughness={0.82} /><Edges color="#44413d" /></mesh>
      <mesh position={[-1.95, 2.65, 0.18]}><boxGeometry args={[0.08, 5.2, 0.08]} /><meshBasicMaterial color="#f3eee1" /></mesh>
      <mesh position={[1.95, 2.65, 0.18]}><boxGeometry args={[0.08, 5.2, 0.08]} /><meshBasicMaterial color="#f3eee1" /></mesh>
      <pointLight position={[0, 2.7, -0.8]} color="#f6ead2" intensity={5} distance={8} decay={2} />
    </group>
  );
}

function Architecture() {
  const centerZ = (PATH_START_Z + PATH_END_Z) / 2;
  const length = PATH_LENGTH + 16;
  const ribs = useMemo(() => Array.from({ length: Math.ceil(length / 4.6) }, (_, index) => PATH_START_Z - 4 - index * 4.6), [length]);
  return (
    <>
      <fog attach="fog" args={['#020202', 9, 46]} />
      <ambientLight intensity={0.3} color="#d8d3c7" />
      <directionalLight position={[0, 7, 7]} intensity={1.1} color="#e7dfcf" />
      <mesh position={[0, -0.08, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, length]} />
        <MeshReflectorMaterial blur={[280, 95]} resolution={512} mixBlur={1.1} mixStrength={1.8} roughness={0.72} depthScale={0.8} minDepthThreshold={0.25} maxDepthThreshold={1.25} color="#060606" metalness={0.45} mirror={0.38} />
      </mesh>
      <gridHelper args={[length, Math.ceil(length / 4), '#4a4945', '#151515']} position={[0, 0.015, centerZ]} />
      <gridHelper args={[length, Math.ceil(length / 4), '#383733', '#111111']} position={[0, 5.5, centerZ]} />
      <gridHelper args={[length, Math.ceil(length / 4), '#393834', '#111111']} position={[-6, 2.75, centerZ]} rotation={[0, 0, Math.PI / 2]} />
      <gridHelper args={[length, Math.ceil(length / 4), '#393834', '#111111']} position={[6, 2.75, centerZ]} rotation={[0, 0, Math.PI / 2]} />
      {ribs.map((z) => <group key={z} position={[0, 0, z]}><mesh position={[-5.82, 2.75, 0]}><boxGeometry args={[0.06, 5.5, 0.06]} /><meshBasicMaterial color="#4a4945" /></mesh><mesh position={[5.82, 2.75, 0]}><boxGeometry args={[0.06, 5.5, 0.06]} /><meshBasicMaterial color="#4a4945" /></mesh><mesh position={[0, 5.36, 0]}><boxGeometry args={[11.7, 0.06, 0.06]} /><meshBasicMaterial color="#43413d" /></mesh></group>)}
      {portalPositions.map((z) => <Portal key={z} z={z} />)}
      <mesh position={[0, 2.75, PATH_END_Z - 1]}><boxGeometry args={[12, 5.5, 0.35]} /><meshStandardMaterial color="#050505" roughness={0.86} /><Edges color="#353431" /></mesh>
      <Sparkles count={420} scale={[11, 5.2, length]} position={[0, 2.8, centerZ]} size={1.25} speed={0.07} opacity={0.36} color="#d6d2c8" />
    </>
  );
}

function CameraRig({ progress, look }: { progress: number; look: { x: number; y: number } }) {
  useFrame(({ camera }, delta) => {
    const targetZ = THREE.MathUtils.lerp(PATH_START_Z, PATH_END_Z, progress);
    const nearestPortal = Math.min(...portalPositions.map((z) => Math.abs(targetZ - z)));
    const doorway = Math.exp(-Math.pow(nearestPortal / 2.4, 2));
    const targetX = Math.sin(progress * Math.PI * chapters.length * 1.15) * 0.12;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5.5, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.68 + doorway * 0.07, 4, delta);
    const yaw = THREE.MathUtils.degToRad(look.x);
    const pitch = THREE.MathUtils.degToRad(look.y);
    camera.lookAt(camera.position.x + Math.sin(yaw) * 12, camera.position.y + Math.sin(pitch) * 10, camera.position.z - Math.cos(yaw) * 12);
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const targetFov = 56 + doorway * 8;
    if (Math.abs(perspectiveCamera.fov - targetFov) > 0.02) { perspectiveCamera.fov = THREE.MathUtils.damp(perspectiveCamera.fov, targetFov, 5, delta); perspectiveCamera.updateProjectionMatrix(); }
  });
  return null;
}

function ExhibitionScene({ progress, look, activeWork, onSelect }: { progress: number; look: { x: number; y: number }; activeWork: number; onSelect: (work: Work) => void }) {
  return (
    <Canvas dpr={[1, 1.55]} camera={{ position: [0, 1.68, PATH_START_Z], fov: 56, near: 0.1, far: 420 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#020202']} />
      <Suspense fallback={null}><Architecture />{works.map((work) => <ArtPanel key={work.id} work={work} active={work.id === activeWork} onSelect={onSelect} />)}</Suspense>
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

  const cameraZ = THREE.MathUtils.lerp(PATH_START_Z, PATH_END_Z, progress);
  const currentRoom = chapterForZ(cameraZ);
  const currentChapter = chapters[currentRoom];
  const nearestPortalIndex = portalPositions.reduce((best, z, index) => Math.abs(z - cameraZ) < Math.abs(portalPositions[best] - cameraZ) ? index : best, 0);
  const transitioning = Math.abs(portalPositions[nearestPortalIndex] - cameraZ) < 2.45;
  const enteringChapter = chapters[Math.min(nearestPortalIndex + 1, chapters.length - 1)];
  const nearest = works.reduce((best, work) => Math.abs(work.position[2] - cameraZ) < Math.abs(best.position[2] - cameraZ) ? work : best, works[0]);

  const walkTo = (next: number) => setProgress(clamp(next));
  const jumpToRoom = (room: number) => walkTo(progressForZ(chapters[room].firstWorkZ + 2.1));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDetail(null); setHelp(false); }
      if (mode !== 'space' || detail) return;
      if (['ArrowDown', 'ArrowRight', 's', 'd'].includes(event.key.toLowerCase())) setProgress((value) => clamp(value + 0.022));
      if (['ArrowUp', 'ArrowLeft', 'w', 'a'].includes(event.key.toLowerCase())) setProgress((value) => clamp(value - 0.022));
      if (event.key === 'Enter') setDetail(nearest);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, mode, nearest]);

  const beginDrag = (event: React.PointerEvent) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, lastY: event.clientY, pointerType: event.pointerType, baseX: look.x, baseY: look.y }; };
  const moveDrag = (event: React.PointerEvent) => {
    if (!drag.current) return;
    if (drag.current.pointerType === 'touch') {
      const delta = drag.current.lastY - event.clientY;
      drag.current.lastY = event.clientY;
      setProgress((value) => clamp(value + delta * 0.00072));
      setLook((value) => ({ ...value, x: clamp(drag.current!.baseX + (event.clientX - drag.current!.x) / 8, -12, 12) }));
      return;
    }
    setLook({ x: clamp(drag.current.baseX + (event.clientX - drag.current.x) / 10, -13, 13), y: clamp(drag.current.baseY - (event.clientY - drag.current.y) / 13, -7, 7) });
  };
  const endDrag = (event: React.PointerEvent) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); drag.current = null; };
  const walk = (event: React.WheelEvent) => { event.preventDefault(); setProgress((value) => clamp(value + clamp(event.deltaY, -180, 180) * 0.00024)); };
  const showRelative = (direction: number) => { if (!detail) return; const index = works.findIndex((work) => work.id === detail.id); setDetail(works[(index + direction + works.length) % works.length]); };

  if (mode === 'ask') return (
    <main className="threshold">
      <div className="threshold-mark" aria-hidden="true"><span /><span /><span /></div>
      <p className="eyebrow">Silenced Voices · Complete Exhibition</p>
      <h1>Enter the<br />exhibition</h1>
      <p className="threshold-intro">Walk through twelve connected rooms tracing aphasia, family care, rehabilitation, design, and the right to expression.</p>
      <div className="mode-grid" aria-label="Choose how to visit"><button onClick={() => setMode('space')}><span className="mode-title">Space</span><span>Scroll through Chapters 00–10 + Appendix</span></button><button onClick={() => setMode('page')}><span className="mode-title">Page</span><span>The quiet editorial · all 29 boards</span></button></div>
      <p className="threshold-note">Scroll to walk · drag to look · click a work to enter</p>
    </main>
  );

  if (mode === 'page') return (
    <main className="reading-mode">
      <header className="reading-header"><button className="wordmark" onClick={() => setMode('ask')}>Silenced Voices</button><span>Complete exhibition · 29 works</span><button onClick={() => setMode('space')}>Space view</button></header>
      <section className="reading-hero"><p>00–10 + A</p><h1>From one family’s silence to a public right to expression.</h1><blockquote>“A missing response is not evidence of a missing thought.”</blockquote></section>
      <div className="reading-list">{works.map((work) => <article key={work.id}><div className="reading-copy"><p className="eyebrow">{work.kicker}</p><h2>{work.title}</h2><p>{work.summary}</p><blockquote>{work.pull}</blockquote></div><button className="board-button" onClick={() => setDetail(work)} aria-label={`Open ${work.title}`}><img src={work.image} alt={`Original exhibition board: ${work.title}`} loading="lazy" /></button></article>)}</div>
      <Detail work={detail} close={() => setDetail(null)} previous={() => showRelative(-1)} next={() => showRelative(1)} />
    </main>
  );

  return (
    <main className={`space-mode room-${currentRoom} ${transitioning ? 'is-transitioning' : ''}`}>
      <section className="room-viewport" aria-label="Interactive 3D exhibition. Scroll to walk, drag to look, and click a mounted work to view it full screen." onWheel={walk} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><ExhibitionScene progress={progress} look={look} activeWork={nearest.id} onSelect={setDetail} /></section>
      <header className="space-header"><button className="wordmark" onClick={() => setMode('ask')}>Silenced <i>Voices</i></button><span>Room {currentChapter.number} / {currentChapter.title}</span><button onClick={() => setMode('page')}>Menu</button></header>
      <nav className="chapter-nav" aria-label="Exhibition rooms">{chapters.map((chapter) => <button key={chapter.number} className={currentRoom === chapter.id ? 'active' : ''} onClick={() => jumpToRoom(chapter.id)} title={chapter.title}>{chapter.number}<span>{chapter.short}</span></button>)}</nav>
      <div className="space-caption"><span>{String(nearest.id).padStart(2, '0')}</span><div><p>{nearest.kicker}</p><h1>{nearest.title}</h1><button onClick={() => setDetail(nearest)}>View full image</button></div></div>
      <div className="walk-instruction">Scroll to walk · Drag to look · Click a work to enter</div>
      <div className="walk-progress" aria-hidden="true"><span style={{ width: `${Math.max(2, progress * 100)}%` }} /></div>
      <button className="nav-arrow prev" disabled={progress <= 0} onClick={() => walkTo(progress - 0.045)} aria-label="Walk backward"><ArrowLeft /></button><button className="nav-arrow next" disabled={progress >= 1} onClick={() => walkTo(progress + 0.045)} aria-label="Walk forward"><ArrowRight /></button>
      <nav className="utility-nav" aria-label="Room controls"><button onClick={() => setHelp(!help)}><MousePointer2 /> Controls</button><button onClick={() => setSound(!sound)}>{sound ? <Volume2 /> : <VolumeX />} {sound ? 'Sound' : 'Quiet'}</button><button onClick={() => setMode('page')}><Eye /> Space / Page</button></nav>
      {help && <aside className="control-card"><button onClick={() => setHelp(false)} aria-label="Close controls"><X /></button><p>Scroll to walk · drag to look</p><strong>Your view now stays where you release it.</strong><span>Pass through each lit doorway to enter the next chapter. Click any mounted page to view it full screen.</span></aside>}
      <div className="room-transition" aria-hidden={!transitioning}><p>Entering</p><strong>{enteringChapter.number}</strong><span>{enteringChapter.title}</span></div>
      <div className="door-flare" />
      <Detail work={detail} close={() => setDetail(null)} previous={() => showRelative(-1)} next={() => showRelative(1)} />
    </main>
  );
}

function Detail({ work, close, previous, next }: { work: Work | null; close: () => void; previous: () => void; next: () => void }) {
  if (!work) return null;
  const index = works.findIndex((item) => item.id === work.id);
  return (
    <div className="detail-backdrop" role="dialog" aria-modal="true" aria-label={work.title}>
      <button className="detail-close" onClick={close} aria-label="Close exhibit"><X /></button>
      <button className="detail-arrow detail-previous" onClick={previous} aria-label="Previous exhibition board"><ArrowLeft /></button><button className="detail-arrow detail-next" onClick={next} aria-label="Next exhibition board"><ArrowRight /></button>
      <article className="detail-copy"><p className="eyebrow">{work.kicker}</p><h2>{work.title}</h2><p>{work.summary}</p><blockquote>{work.pull}</blockquote><span className="detail-count">{String(index + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}</span></article>
      <div className="detail-board"><img src={work.image} alt={`Full exhibition board: ${work.title}`} /></div>
    </div>
  );
}
