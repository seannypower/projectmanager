import { useState, useMemo } from 'react';
import { PRI, PROJ_COLOR, DUR_BRICK, sumHours } from './data';

function shuffle(arr, seed) {
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuickTasks({ tasks, onSelect }) {
  const [open, setOpen] = useState(true);
  const [seed, setSeed] = useState(42);

  const quick = useMemo(() => {
    const candidates = tasks.filter(t => {
      if (t.done) return false;
      const dur = t.subs.length > 0 ? sumHours(t.subs) : parseFloat(t.est) || 0;
      return dur > 0 && dur <= 2;
    });
    return shuffle(candidates, seed).slice(0, 4);
  }, [tasks, seed]);

  if (quick.length === 0) return null;

  return (
    <div style={{ width: 210, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 12 : 0 }}>
        <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>
            {open ? '▾' : '▸'} Quick wins
          </span>
        </button>
        {open && (
          <button
            onClick={() => setSeed(s => (s * 1664525 + 1013904223) & 0x7fffffff || 1)}
            title="Shuffle"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, padding: '2px 4px', lineHeight: 1, transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#9aa1ad'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
          >↺</button>
        )}
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quick.map(t => {
            const p = PRI[t.priority] || PRI.ongoing;
            const dur = t.subs.length > 0 ? sumHours(t.subs) + 'h' : t.est;
            return (
              <div
                key={t.id}
                onClick={() => onSelect(t.id)}
                style={{ background: p.tint, border: `1.5px solid ${p.color}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', transition: 'opacity 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flex: 'none' }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: p.color }}>{p.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#edebe5', lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {t.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 500, color: '#fff', background: PROJ_COLOR[t.project] || PROJ_COLOR.personal }}>{t.project}</span>
                  {dur && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 500, color: '#fff', background: DUR_BRICK }}>{dur}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
