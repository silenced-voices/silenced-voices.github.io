'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, MousePointer2, Volume2, VolumeX, X } from 'lucide-react';

type Stop = { id: number; kicker: string; title: string; image: string; summary: string; pull: string };

const stops: Stop[] = [
  { id: 1, kicker: 'The opening question', title: 'Who is losing a voice?', image: '/chapter-1/page-03.jpg', summary: 'Aphasia does not interrupt only one person’s language. It changes how a family speaks, transfers the work of interpretation, and exposes the pressures carried by the people rebuilding communication.', pull: 'They are not people without voices. Their voices are struggling to reach others.' },
  { id: 2, kicker: '01 · The patient', title: 'Aphasia is not a refusal to speak', image: '/chapter-1/page-04.jpg', summary: 'Aphasia is an acquired communication disorder caused by damage to the brain’s language system. It may affect speaking, understanding, reading, or writing. A missing response is not evidence of a missing thought.', pull: 'The thought remains. The exit is obstructed.' },
  { id: 3, kicker: '02 · Family caregiver / 03 · Rehabilitation professional', title: 'The work around a voice', image: '/chapter-1/page-05.jpg', summary: 'Relatives become interpreters, record keepers, exercise partners, and advocates. Clinicians assess, observe, adjust, and guide. Communication depends on sustained attention from both sides of the exchange.', pull: 'Speaking for someone. Struggling to be heard. Small changes. Demanding work.' },
];

export default function Home() {
  const [mode, setMode] = useState<'ask' | 'space' | 'page'>('ask');
  const [active, setActive] = useState(0);
  const [detail, setDetail] = useState<Stop | null>(null);
  const [sound, setSound] = useState(false);
  const [help, setHelp] = useState(true);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDetail(null); setHelp(false); }
      if (mode !== 'space' || detail) return;
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') setActive((v) => Math.min(stops.length - 1, v + 1));
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') setActive((v) => Math.max(0, v - 1));
      if (event.key === 'Enter') setDetail(stops[active]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, detail, mode]);

  const beginDrag = (event: React.PointerEvent) => { drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); };
  const moveDrag = (event: React.PointerEvent) => {
    if (!drag.current) return;
    setLook({ x: Math.max(-7, Math.min(7, (event.clientX - drag.current.x) / 30)), y: Math.max(-4, Math.min(4, -(event.clientY - drag.current.y) / 45)) });
  };
  const endDrag = () => { drag.current = null; setLook({ x: 0, y: 0 }); };

  if (mode === 'ask') return (
    <main className="threshold">
      <div className="threshold-mark" aria-hidden="true"><span /><span /><span /></div>
      <p className="eyebrow">Silenced Voices · Chapter 01</p>
      <h1>Who is<br />losing a voice?</h1>
      <p className="threshold-intro">Enter a spatial chapter about aphasia, care, and the right to be understood.</p>
      <div className="mode-grid" aria-label="Choose how to visit">
        <button onClick={() => setMode('space')}><span className="mode-title">Space</span><span>A real-time gallery · walk the room</span></button>
        <button onClick={() => setMode('page')}><span className="mode-title">Page</span><span>The quiet editorial · reads like print</span></button>
      </div>
      <p className="threshold-note">Your choice can be changed at any time.</p>
    </main>
  );

  if (mode === 'page') return (
    <main className="reading-mode">
      <header className="reading-header"><button className="wordmark" onClick={() => setMode('ask')}>Silenced Voices</button><span>Chapter 01 · 03 exhibits</span><button onClick={() => setMode('space')}>Space view</button></header>
      <section className="reading-hero"><p>01</p><h1>Who is losing a voice?</h1><blockquote>“A missing response is not evidence of a missing thought.”</blockquote></section>
      <div className="reading-list">{stops.map((stop) => <article key={stop.id}><div className="reading-copy"><p className="eyebrow">{stop.kicker}</p><h2>{stop.title}</h2><p>{stop.summary}</p><blockquote>{stop.pull}</blockquote></div><button className="board-button" onClick={() => setDetail(stop)} aria-label={`Open ${stop.title}`}><img src={stop.image} alt={`Original exhibition board: ${stop.title}`} /></button></article>)}</div>
      <Detail stop={detail} close={() => setDetail(null)} />
    </main>
  );

  return (
    <main className="space-mode">
      <header className="space-header"><button className="wordmark" onClick={() => setMode('ask')}>Silenced <i>Voices</i></button><span>Room 01 / Who is losing a voice?</span><button onClick={() => setMode('page')}>Read page</button></header>
      <div className="category-rail" aria-label="Chapter progress">{stops.map((stop, i) => <button key={stop.id} className={i === active ? 'active' : ''} onClick={() => setActive(i)}>{String(i + 1).padStart(2, '0')}<span>{stop.kicker}</span></button>)}</div>
      <section className="room-viewport" aria-label="3D room. Drag to look. Use left and right arrows to move between exhibits." onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="room" style={{ '--yaw': `${look.x}deg`, '--pitch': `${look.y}deg`, '--stop': active } as React.CSSProperties}>
          <div className="ceiling grid-surface" /><div className="floor grid-surface" /><div className="back-wall"><div className="chapter-number">01</div><p>When a person loses language,<br />what else is lost?</p></div><div className="left-wall" /><div className="right-wall" />
          <div className="light light-a" /><div className="light light-b" /><div className="light light-c" />
          {stops.map((stop, i) => <button key={stop.id} className={`exhibit exhibit-${i + 1} ${active === i ? 'active' : ''}`} onClick={() => { setActive(i); if (active === i) setDetail(stop); }} aria-label={`${stop.title}. ${active === i ? 'Open exhibit' : 'Move to exhibit'}`}><span className="exhibit-frame"><img src={stop.image} alt="" /></span><span className="exhibit-label"><b>{String(i + 1).padStart(2, '0')}</b>{stop.title}</span></button>)}
          <div className="bench"><span /><span /></div>
        </div>
      </section>
      <div className="space-caption"><span>{String(active + 1).padStart(2, '0')}</span><div><p>{stops[active].kicker}</p><h1>{stops[active].title}</h1></div></div>
      <button className="nav-arrow prev" disabled={active === 0} onClick={() => setActive(active - 1)} aria-label="Previous exhibit"><ChevronLeft /></button><button className="nav-arrow next" disabled={active === stops.length - 1} onClick={() => setActive(active + 1)} aria-label="Next exhibit"><ChevronRight /></button>
      <nav className="utility-nav" aria-label="Room controls"><button onClick={() => setHelp(!help)}><MousePointer2 /> Controls</button><button onClick={() => setSound(!sound)}>{sound ? <Volume2 /> : <VolumeX />} {sound ? 'Sound' : 'Quiet'}</button><button onClick={() => setMode('page')}><Eye /> Space / Page</button></nav>
      {help && <aside className="control-card"><button onClick={() => setHelp(false)} aria-label="Close controls"><X /></button><p>Drag to look · arrows to walk</p><strong>Click the glowing board to open it.</strong><span>Press Esc at any time.</span></aside>}
      <Detail stop={detail} close={() => setDetail(null)} />
    </main>
  );
}

function Detail({ stop, close }: { stop: Stop | null; close: () => void }) {
  if (!stop) return null;
  return <div className="detail-backdrop" role="dialog" aria-modal="true" aria-label={stop.title}><button className="detail-close" onClick={close} aria-label="Close exhibit"><X /></button><div className="detail-board"><img src={stop.image} alt={`Full exhibition board: ${stop.title}`} /></div><article className="detail-copy"><p className="eyebrow">{stop.kicker}</p><h2>{stop.title}</h2><p>{stop.summary}</p><blockquote>{stop.pull}</blockquote><p className="detail-note">The original board remains visible alongside this readable interpretation.</p></article></div>;
}
