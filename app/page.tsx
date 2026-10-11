'use client';

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { Edges, MeshReflectorMaterial, Sparkles, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, MousePointer2, X } from 'lucide-react';
import type { ProfileMetrics } from './exhibition-scene';

type LongTaskMetrics = { count: number; worstMs: number };
type ResourceMetrics = { boards: number; bytes: number };

declare global {
  interface Window {
    __silencedVoiceProfile?: {
      scene: ProfileMetrics | null;
      longTasks: LongTaskMetrics;
      resources: ResourceMetrics;
    };
  }
}

type Chapter = {
  id: number;
  number: string;
  short: string;
  title: string;
  boards: BoardRef[];
  bays: BoardRef[][];
  firstWorkZ: number;
  lastWorkZ: number;
  portalZ?: number;
};

type BoardRef = {
  page: number;
  half: 'full' | 'left' | 'right';
  title: string;
  cover?: boolean;
  fullSpread?: boolean;
};

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

const board = (page: number, half: BoardRef['half'], title: string, cover = false, fullSpread = false): BoardRef => ({ page, half, title, cover, fullSpread });

const chapterSource = [
  { number: '00', short: 'Prologue', title: 'A Personal Beginning', boards: [
    board(1, 'full', 'Silenced Voices', true), board(2, 'left', 'What I Could Still Say'), board(2, 'right', 'I Want to Turn on the Light'), board(3, 'left', 'When a Person Loses Language, What Else Is Lost?'),
  ] },
  { number: '01', short: 'Losing a Voice', title: 'Who Is Losing a Voice?', boards: [
    board(3, 'right', 'Who Is Losing a Voice?', true), board(4, 'left', 'Aphasia Is Not a Refusal to Speak'), board(4, 'right', 'The Thought Remains'), board(5, 'left', 'The Family Caregiver'), board(5, 'right', 'The Rehabilitation Professional'), board(6, 'left', 'Aphasia Is Not an Individual Problem'),
  ] },
  { number: '02', short: 'The Lost Window', title: 'The Lost Window', boards: [
    board(6, 'right', 'The Lost Window', true), board(7, 'left', 'Everyday Care'), board(7, 'right', 'Two Timelines'), board(8, 'left', 'The Need to Communicate Does Not Wait'),
  ] },
  { number: '03', short: 'Marginalized', title: 'The Marginalized Treatment', boards: [
    board(8, 'right', 'The Marginalized Treatment', true), board(9, 'left', 'A Step Can Be Seen'), board(9, 'right', 'Support Shelves'), board(10, 'full', 'Recognition Must Reinforce Itself', false, true),
  ] },
  { number: '04', short: 'History', title: 'History of Aphasia', boards: [
    board(11, 'left', 'History of Aphasia', true), board(11, 'right', 'From Localization to Participation'), board(12, 'left', 'When Professional Care Recedes'), board(12, 'right', 'Public Medical Issue Versus Household Problem'), board(13, 'left', 'Recognition Is Not Enough'),
  ] },
  { number: '05', short: 'Gentle Silence', title: 'The Gentle Silence', boards: [
    board(13, 'right', 'The Gentle Silence', true), board(14, 'left', 'I Have Something to Say'), board(14, 'right', 'We Thought This Was Care'), board(15, 'full', 'Fed, Warm, Medicated — Is That Enough?', false, true),
  ] },
  { number: '06', short: 'Field Notes', title: 'Making Silence Visible', boards: [
    board(16, 'left', 'Field Notes: Making Silence Visible', true), board(16, 'right', 'How Were These Voices Collected?'), board(17, 'left', 'Five Participants, Five Forms of Silence'), board(17, 'right', 'A System Between Expertise and Capacity'), board(18, 'left', 'What the Voices Revealed'), board(18, 'right', 'Scenes Without Sound'),
  ] },
  { number: '07', short: 'Rehabilitation', title: 'Rehabilitation', boards: [
    board(19, 'left', 'Rehabilitation', true), board(19, 'right', 'The Rehabilitation Process'), board(20, 'left', 'Geometry of Training Materials'), board(20, 'right', "The Therapist’s Invisible Labor"), board(21, 'left', 'Please Wait. Let Them Finish.'),
  ] },
  { number: '08', short: 'SilentCare', title: 'SilentCare', boards: [
    board(21, 'right', 'SilentCare', true), board(22, 'left', 'Five Iterations Toward a Wearable System'), board(22, 'right', 'Capacitive Touch and Haptic Feedback'), board(23, 'left', 'From Sensor Data to a State'), board(23, 'right', 'Caregiver Application'),
  ] },
  { number: '09', short: 'Expression', title: 'The Right to Expression', boards: [
    board(24, 'left', 'The Right to Expression', true), board(24, 'right', 'Six Changes a Family Can Begin Today'), board(25, 'left', 'Rehabilitation Should Not End at Discharge'), board(25, 'right', 'Students Can Become Part of the Listening System'), board(26, 'left', 'From One Family to a Public Issue'),
  ] },
  { number: '10', short: 'Learning to Wait', title: 'Learning How to Wait', boards: [
    board(26, 'right', 'Learning How to Wait', true), board(27, 'full', 'How Does a Voice Return?', false, true),
  ] },
  { number: 'A', short: 'Appendix', title: 'Research Appendix', boards: [
    board(28, 'left', 'Interview Guide'), board(28, 'right', 'Public Awareness Survey'), board(29, 'left', 'Research Ethics'), board(29, 'right', 'Asset & Evidence Register'),
  ] },
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

const BAY_SPACING = 6.15;
const PORTAL_GAP = 4.5;
let layoutCursor = 3.1;

// Each depth bay holds no more than two portraits on a wall. A continuous
// landscape spread is a bay by itself because it already carries two pages.
const bayWallPatterns = [
  [-1, 1],
  [-1, 1, -1],
  [1, -1],
  [-1, 1],
  [1, -1],
  [-1, 1],
  [1, -1, 1],
  [-1, 1],
  [1, -1],
  [-1, 1],
  [-1],
  [-1, 1],
];

function groupIntoBays(boards: BoardRef[]) {
  const cover = boards.find((item) => item.cover);
  const content = boards.filter((item) => !item.cover);
  const bays: BoardRef[][] = cover ? [[cover]] : [];
  for (let index = 0; index < content.length;) {
    const current = content[index];
    if (current.fullSpread) {
      bays.push([current]);
      index += 1;
    } else {
      const next = content[index + 1];
      bays.push(next && !next.fullSpread ? [current, next] : [current]);
      index += next && !next.fullSpread ? 2 : 1;
    }
  }
  return bays;
}

const chapters: Chapter[] = chapterSource.map((source, chapterIndex) => {
  const firstWorkZ = layoutCursor;
  const bays = groupIntoBays(source.boards);
  const lastWorkZ = firstWorkZ - (bays.length - 1) * BAY_SPACING;
  const portalZ = chapterIndex < chapterSource.length - 1 ? lastWorkZ - PORTAL_GAP : undefined;
  layoutCursor = portalZ === undefined ? lastWorkZ : portalZ - PORTAL_GAP;
  return { ...source, id: chapterIndex, bays, firstWorkZ, lastWorkZ, portalZ };
});

const works: Work[] = chapters.flatMap((chapter) => chapter.bays.flatMap((bay, bayIndex) => bay.map((item, pairIndex) => {
  const source = copy[item.page];
  const contentBayIndex = bayIndex - (chapter.bays[0][0].cover ? 1 : 0);
  const side = item.cover ? 0 : bayWallPatterns[chapter.id][contentBayIndex] ?? (contentBayIndex % 2 === 0 ? -1 : 1);
  const label = item.half === 'full' ? (item.page === 1 ? '01' : String(item.page).padStart(2, '0')) : `${String(item.page).padStart(2, '0')}${item.half === 'left' ? 'L' : 'R'}`;
  const pairedX = side < 0 ? [-4.42, -1.92] : [1.92, 4.42];
  const x = item.cover ? 0 : item.fullSpread ? side * 3.35 : bay.length === 2 ? pairedX[pairIndex] : side * 3.44;
  return {
    id: `${item.page}-${item.half}`,
    label,
    sourcePage: item.page,
    cover: Boolean(item.cover),
    room: chapter.id,
    kicker: `${chapter.number} · ${chapter.title}`,
    title: item.title,
    image: `/boards/page-${String(item.page).padStart(2, '0')}-${item.half}.jpg`,
    summary: source.summary,
    pull: source.pull,
    position: [x, item.cover ? 2.62 : item.fullSpread ? 2.48 : 2.52, chapter.firstWorkZ - bayIndex * BAY_SPACING] as [number, number, number],
    rotation: item.cover ? 0 : side < 0 ? 0.25 : -0.25,
    size: item.cover ? [2.46, 3.48] : item.fullSpread ? [4.5, 3.18] : [2.28, 3.22],
  };
})));

const PATH_START_Z = 8.2;
const PATH_END_Z = works[works.length - 1].position[2] - 4.2;
const PATH_LENGTH = PATH_START_Z - PATH_END_Z;
const portalPositions = chapters.slice(0, -1).map((chapter) => chapter.portalZ as number);
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const progressForZ = (z: number) => clamp((PATH_START_Z - z) / PATH_LENGTH);
const LazyExhibitionScene = lazy(() => import('./exhibition-scene'));

function chapterForZ(z: number) {
  let room = 0;
  portalPositions.forEach((portal, index) => { if (z < portal) room = index + 1; });
  return room;
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
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'default';
    return () => { document.body.style.cursor = 'default'; };
  }, [hovered]);

  useFrame(({ camera }, delta) => {
    if (!work.cover || !group.current) return;
    // Start dissolving just before the portrait becomes larger than the view,
    // then clear it before the camera reaches the threshold.
    const target = THREE.MathUtils.clamp((camera.position.z - work.position[2] - 2.0) / 1.15, 0, 1);
    fade.current = THREE.MathUtils.damp(fade.current, target, 18, delta);
    group.current.visible = fade.current > 0.012;
    const capturePointer = fade.current > 0.98;
    [frameMesh.current, imageMesh.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.raycast = capturePointer ? THREE.Mesh.prototype.raycast : () => undefined;
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
    if (event.delta > 6) return;
    onSelect(work);
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

  return (
    <group>
      <group position={[0, 0, z]}>
        <mesh position={[0, 0.34, 0]}><boxGeometry args={[2.8, 0.13, 0.82]} /><meshStandardMaterial color="#11110f" roughness={0.42} metalness={0.58} /><Edges color="#5b5750" /></mesh>
        <mesh position={[-1.05, 0.15, 0]}><boxGeometry args={[0.09, 0.3, 0.58]} /><meshBasicMaterial color="#4a4741" /></mesh>
        <mesh position={[1.05, 0.15, 0]}><boxGeometry args={[0.09, 0.3, 0.58]} /><meshBasicMaterial color="#4a4741" /></mesh>
        <mesh position={[0, 0.018, 0]}><boxGeometry args={[4.5, 0.018, 1.3]} /><meshBasicMaterial color={accent} transparent opacity={0.13} /></mesh>
      </group>

      <group position={[side * 4.72, 0, z - 1.25]}>
        <mesh position={[0, 0.62, 0]}><boxGeometry args={[1.08, 1.24, 1.08]} /><meshStandardMaterial color="#0b0b0a" roughness={0.35} metalness={0.68} transparent opacity={0.82} /><Edges color={accent} /></mesh>
        <group ref={sculpture} position={[0, 2.05, 0]}>
          <mesh><torusGeometry args={[0.54, 0.024, 8, 56]} /><meshBasicMaterial color={accent} transparent opacity={0.78} /></mesh>
          <mesh rotation={[Math.PI / 2, 0.35, 0]}><torusGeometry args={[0.37, 0.018, 8, 48]} /><meshBasicMaterial color="#ded8ca" transparent opacity={0.56} /></mesh>
          <mesh rotation={[0.4, Math.PI / 2, 0.25]}><torusGeometry args={[0.7, 0.014, 8, 64]} /><meshBasicMaterial color={accent} transparent opacity={0.38} /></mesh>
          <mesh><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#f1ece0" /></mesh>
        </group>
        <pointLight position={[0, 1.65, 0.8]} color={accent} intensity={2.2} distance={5.5} decay={2} />
      </group>

      <group position={[-side * 5.15, 0, z + 1.8]}>
        {[0, 0.36, 0.72].map((offset, index) => <mesh key={offset} position={[offset * side, 2.1 + index * 0.36, 0]}><boxGeometry args={[0.035, 4.2 - index * 0.72, 0.035]} /><meshBasicMaterial color={index === 1 ? accent : '#6e6a62'} transparent opacity={0.72} /></mesh>)}
        <mesh position={[0.36 * side, 4.7, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshBasicMaterial color={accent} /></mesh>
      </group>
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
      {chapters.map((chapter) => <RoomDecor key={chapter.number} chapter={chapter} />)}
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
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.2 + doorway * 0.07, 4, delta);
    const yaw = THREE.MathUtils.degToRad(look.x);
    const pitch = THREE.MathUtils.degToRad(look.y);
    camera.lookAt(camera.position.x + Math.sin(yaw) * 12, camera.position.y + Math.sin(pitch) * 10, camera.position.z - Math.cos(yaw) * 12);
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const targetFov = 56 + doorway * 8;
    if (Math.abs(perspectiveCamera.fov - targetFov) > 0.02) { perspectiveCamera.fov = THREE.MathUtils.damp(perspectiveCamera.fov, targetFov, 5, delta); perspectiveCamera.updateProjectionMatrix(); }
  });
  return null;
}

function ExhibitionScene({ progress, look, activeWork, onSelect }: { progress: number; look: { x: number; y: number }; activeWork: string; onSelect: (work: Work) => void }) {
  return (
    <Canvas dpr={[1, 1.55]} camera={{ position: [0, 2.2, PATH_START_Z], fov: 56, near: 0.1, far: 560 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#020202']} />
      <Suspense fallback={null}><Architecture />{works.map((work) => <ArtPanel key={work.id} work={work} active={work.id === activeWork} onSelect={onSelect} />)}</Suspense>
      <CameraRig progress={progress} look={look} />
    </Canvas>
  );
}

export default function Home() {
  const [mode, setMode] = useState<'ask' | 'space'>('ask');
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState<Work | null>(null);
  const [help, setHelp] = useState(true);
  const [opening, setOpening] = useState(false);
  const [mobileNotice, setMobileNotice] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [profiling] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('profile') === '1');
  const [profileMetrics, setProfileMetrics] = useState<ProfileMetrics | null>(null);
  const [longTasks, setLongTasks] = useState<LongTaskMetrics>({ count: 0, worstMs: 0 });
  const [profileResources, setProfileResources] = useState<ResourceMetrics>({ boards: 0, bytes: 0 });
  const drag = useRef<{ x: number; y: number; lastY: number; pointerType: string; baseX: number; baseY: number; captured: boolean } | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const lastWalkTime = useRef<number | null>(null);
  const reportProfile = useCallback((metrics: ProfileMetrics) => setProfileMetrics(metrics), []);

  useEffect(() => {
    if (!profiling || typeof PerformanceObserver === 'undefined') return;
    const boardResources = new Set<string>();
    const observe = (type: 'longtask' | 'resource', callback: PerformanceObserverCallback) => {
      try {
        const observer = new PerformanceObserver(callback);
        observer.observe({ type, buffered: true } as PerformanceObserverInit);
        return observer;
      } catch { return null; }
    };
    const longTaskObserver = observe('longtask', (list) => {
      list.getEntries().forEach((entry) => setLongTasks((current) => ({ count: current.count + 1, worstMs: Math.max(current.worstMs, Math.round(entry.duration)) })));
    });
    const resourceObserver = observe('resource', (list) => {
      list.getEntries().forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        if (!resource.name.includes('/boards/') || boardResources.has(resource.name)) return;
        boardResources.add(resource.name);
        setProfileResources((current) => ({ boards: current.boards + 1, bytes: current.bytes + resource.transferSize }));
      });
    });
    return () => { longTaskObserver?.disconnect(); resourceObserver?.disconnect(); };
  }, [profiling]);

  useEffect(() => {
    if (!profiling) return;
    window.__silencedVoiceProfile = { scene: profileMetrics, longTasks, resources: profileResources };
  }, [profiling, profileMetrics, longTasks, profileResources]);

  const cameraZ = THREE.MathUtils.lerp(PATH_START_Z, PATH_END_Z, progress);
  const currentRoom = chapterForZ(cameraZ);
  const currentChapter = chapters[currentRoom];
  const nearestPortalIndex = portalPositions.reduce((best, z, index) => Math.abs(z - cameraZ) < Math.abs(portalPositions[best] - cameraZ) ? index : best, 0);
  const distanceBeforePortal = cameraZ - portalPositions[nearestPortalIndex];
  const transitioning = distanceBeforePortal > 0.7 && distanceBeforePortal < PORTAL_GAP - 0.2;
  const enteringChapter = chapters[Math.min(nearestPortalIndex + 1, chapters.length - 1)];
  // Once the camera has walked beyond a chapter cover, it is scenery only.
  // Keeping it out of the active selection prevents keyboard/default selection
  // from reopening a cover while the visitor is engaging with the wall behind it.
  const selectableWorks = works.filter((work) => !work.cover || cameraZ - work.position[2] < 1.2);
  const nearest = selectableWorks.reduce((best, work) => Math.abs(work.position[2] - cameraZ) < Math.abs(best.position[2] - cameraZ) ? work : best, selectableWorks[0] ?? works[0]);

  const walkTo = (next: number) => {
    targetProgressRef.current = clamp(next);
    if (animationFrame.current !== null) return;
    const advance = (time: number) => {
      const previousTime = lastWalkTime.current ?? time;
      const elapsed = Math.min((time - previousTime) / 1000, 0.05);
      lastWalkTime.current = time;
      const target = targetProgressRef.current;
      const distance = target - progressRef.current;
      const nextProgress = Math.abs(distance) < 0.0002 ? target : progressRef.current + Math.sign(distance) * Math.min(Math.abs(distance), elapsed * 0.3);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      if (Math.abs(target - nextProgress) > 0.0002) {
        animationFrame.current = window.requestAnimationFrame(advance);
      } else {
        animationFrame.current = null;
        lastWalkTime.current = null;
      }
    };
    animationFrame.current = window.requestAnimationFrame(advance);
  };
  const jumpToRoom = (room: number) => walkTo(progressForZ(chapters[room].firstWorkZ + 4.1));

  useEffect(() => () => { if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current); }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDetail(null); setHelp(false); }
      if (mode !== 'space' || detail) return;
      if (['ArrowDown', 'ArrowRight', 's', 'd'].includes(event.key.toLowerCase())) walkTo(targetProgressRef.current + 0.012);
      if (['ArrowUp', 'ArrowLeft', 'w', 'a'].includes(event.key.toLowerCase())) walkTo(targetProgressRef.current - 0.012);
      if (event.key === 'Enter') setDetail(nearest);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, mode, nearest]);

  const beginDrag = (event: React.PointerEvent) => { drag.current = { x: event.clientX, y: event.clientY, lastY: event.clientY, pointerType: event.pointerType, baseX: look.x, baseY: look.y, captured: false }; };
  const moveDrag = (event: React.PointerEvent) => {
    if (!drag.current) return;
    const moved = Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y);
    if (moved > 4 && !drag.current.captured) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current.captured = true;
    }
    if (drag.current.pointerType === 'touch') {
      const delta = drag.current.lastY - event.clientY;
      drag.current.lastY = event.clientY;
      walkTo(targetProgressRef.current + delta * 0.00026);
      setLook((value) => ({ ...value, x: clamp(drag.current!.baseX + (event.clientX - drag.current!.x) / 8, -12, 12) }));
      return;
    }
    setLook({ x: clamp(drag.current.baseX + (event.clientX - drag.current.x) / 10, -13, 13), y: clamp(drag.current.baseY - (event.clientY - drag.current.y) / 13, -7, 7) });
  };
  const endDrag = (event: React.PointerEvent) => { if (drag.current?.captured && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); drag.current = null; };
  const walk = (event: React.WheelEvent) => { event.preventDefault(); walkTo(targetProgressRef.current + clamp(event.deltaY, -140, 140) * 0.000085); };
  const showRelative = (direction: number) => { if (!detail) return; const index = works.findIndex((work) => work.id === detail.id); setDetail(works[(index + direction + works.length) % works.length]); };
  const enterExhibition = async () => {
    if (opening) return;
    if (window.matchMedia('(max-width: 820px)').matches) { setMobileNotice(true); return; }
    setOpening(true);
    const startedAt = performance.now();
    const allArtwork = works.map((work) => work.image);
    const initialArtwork = works.filter((work) => Math.abs(work.position[2] - PATH_START_Z) < 42).map((work) => work.image);
    const warmImage = (source: string, decode = false) => new Promise<void>((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (!decode || typeof image.decode !== 'function') { resolve(); return; }
        image.decode().catch(() => undefined).finally(resolve);
      };
      image.onerror = () => resolve();
      image.src = source;
    });

    const preparation = Promise.all([
      import('./exhibition-scene').then((scene) => scene.preloadArtwork(initialArtwork)).catch(() => undefined),
      ...allArtwork.map((source) => warmImage(source, initialArtwork.includes(source))),
    ]);
    await preparation;
    // The gallery canvas mounts behind the entry screen while the image cache is
    // filled. Keeping the screen up a little longer also gives WebGL a chance to
    // compile its first shaders and upload the starting room before interaction.
    const remaining = Math.max(0, 4200 - (performance.now() - startedAt));
    window.setTimeout(() => { setMode('space'); setOpening(false); }, remaining);
  };

  const landing = mode === 'ask' ? (
    <main className={`threshold ${opening ? 'is-entering' : ''}`}>
      <header className="opening-header"><span>Silenced Voices</span><span>A spatial research exhibition · 2026</span></header>
      <section className="opening-scene">
        <div className="opening-objects" aria-hidden="true"><span className="object-orbit orbit-one" /><span className="object-orbit orbit-two" /><span className="object-tag">ARCHIVE / 2026</span><span className="object-rule" /></div>
        <div className="opening-copy">
          <p className="eyebrow">Chapter 00 · A personal beginning</p>
          <h1>Silenced<br /><i>Voices</i></h1>
          <p className="threshold-intro">An exhibition about aphasia, family care, and the right to be understood. Begin with one grandmother whose thoughts remained present when language became difficult to reach.</p>
          <div className="opening-actions">
            <button className="enter-button" onClick={enterExhibition}><span>Enter the exhibition</span><ArrowRight /></button>
          </div>
        </div>
        <button className="opening-stage" onClick={enterExhibition} aria-label="Enter the spatial exhibition">
          <span className="opening-halo" />
          <span className="opening-rail rail-left" /><span className="opening-rail rail-right" />
          <span className="opening-frame"><img src="/boards/page-01-full.jpg" alt="Silenced Voices exhibition cover" /></span>
          <span className="opening-shadow" />
          <span className="opening-index">00 / Threshold</span>
        </button>
      </section>
      <footer className="opening-footer"><span>Scroll to walk · drag to look · click a work to enter</span><span>Chapters 00–10 + Appendix</span></footer>
      <div className="opening-transition" aria-hidden="true"><span /><p>Preparing the gallery</p></div>
      {mobileNotice && <div className="mobile-notice" role="dialog" aria-modal="true" aria-label="Best viewing experience"><button onClick={() => setMobileNotice(false)} aria-label="Close message"><X /></button><p>Silenced Voices</p><strong>Please view this website on a laptop for the best viewing experience.</strong><span>The full spatial exhibition is designed for a larger screen.</span></div>}
    </main>
  ) : null;

  return (
    <>
      {landing}
      {(opening || mode === 'space') && <main key="gallery" className={`space-mode room-${currentRoom} ${opening ? 'is-prewarming' : ''} ${transitioning ? 'is-transitioning' : ''}`}>
      <section className="room-viewport" aria-label="Interactive 3D exhibition. Scroll to walk, drag to look, and click a mounted work to view it full screen." onWheel={walk} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><Suspense fallback={<div className="scene-loader" aria-label="Loading exhibition" />}><LazyExhibitionScene progress={progress} look={look} activeWork={nearest.id} onSelect={setDetail} works={works} chapters={chapters} portalPositions={portalPositions} pathStartZ={PATH_START_Z} pathEndZ={PATH_END_Z} profiling={profiling} onProfile={reportProfile} /></Suspense></section>
      {opening && <div className="gallery-prewarm" role="status" aria-live="polite"><span /><p>Preparing the gallery</p><small>Loading rooms for a smoother first walk</small></div>}
      {profiling && <aside className="performance-profile" aria-live="polite"><span>Temporary performance profile</span><b>{profileMetrics ? `${profileMetrics.fps} FPS` : 'Starting canvas…'}</b><p>{profileMetrics ? `${profileMetrics.averageFrameMs}ms average · ${profileMetrics.worstFrameMs}ms peak · ${profileMetrics.slowFrames} slow frames` : 'Collecting frame timing'}</p><p>{profileMetrics ? `${profileMetrics.activePanels} panels · ${profileMetrics.textures} GPU textures · ${profileMetrics.drawCalls} draw calls` : 'Waiting for GPU data'}</p><p>{longTasks.count} main-thread long tasks · worst {longTasks.worstMs}ms</p><p>{profileResources.boards} board files · {(profileResources.bytes / 1024 / 1024).toFixed(1)}MB transferred</p></aside>}
      <div className="gallery-atmosphere" aria-hidden="true"><span className="atmosphere-orbit" /><span className="atmosphere-beam beam-one" /><span className="atmosphere-beam beam-two" /></div>
      <div className="gallery-readout" aria-hidden="true"><span>EXHIBITION INDEX</span><b>{String(currentRoom + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</b><i>Spatial studies · listening architecture</i></div>
      <header className="space-header"><button className="wordmark" onClick={() => setMode('ask')}>Silenced <i>Voices</i></button><span>Room {currentChapter.number} / {currentChapter.title}</span></header>
      <nav className="chapter-nav" aria-label="Exhibition rooms">{chapters.map((chapter) => <button key={chapter.number} className={currentRoom === chapter.id ? 'active' : ''} onClick={() => jumpToRoom(chapter.id)} title={chapter.title}>{chapter.number}<span>{chapter.short}</span></button>)}</nav>
      <div className="space-caption"><span>{nearest.label}</span><div key={nearest.id}><p className="caption-kicker">{nearest.kicker}</p><h1>{nearest.title}</h1><p className="space-summary">{nearest.summary}</p><blockquote>{nearest.pull}</blockquote><button onClick={() => setDetail(nearest)}>View full image</button></div></div>
      <div className="walk-instruction">Scroll to walk · Drag to look · Click a work to enter</div>
      <div className="walk-progress" aria-hidden="true"><span style={{ width: `${Math.max(2, progress * 100)}%` }} /></div>
      <button className="nav-arrow prev" disabled={progress <= 0} onClick={() => walkTo(progress - 0.012)} aria-label="Walk backward"><ArrowLeft /></button><button className="nav-arrow next" disabled={progress >= 1} onClick={() => walkTo(progress + 0.012)} aria-label="Walk forward"><ArrowRight /></button>
      <nav className="utility-nav" aria-label="Room controls"><button onClick={() => setHelp(!help)}><MousePointer2 /> Controls</button></nav>
      {help && <aside className="control-card"><button onClick={() => setHelp(false)} aria-label="Close controls"><X /></button><p>Scroll to walk · drag to look</p><span>Pass through each lit doorway to enter the next chapter. Click any mounted page to view it full screen.</span></aside>}
      <div className="room-transition" aria-hidden={!transitioning}><p>Entering</p><strong>{enteringChapter.number}</strong><span>{enteringChapter.title}</span></div>
      <div className="door-flare" />
      <Detail work={detail} close={() => setDetail(null)} previous={() => showRelative(-1)} next={() => showRelative(1)} />
      </main>}
    </>
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
