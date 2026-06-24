import { useState, useMemo } from 'react';
import { PRI, PROJ_COLOR, DUR_BRICK } from './data';

export function QuickTasks({ tasks, onSelect }) {
  const [open, setOpen] = useState(true);
  const [picks, setPicks] = useState(null); // null = use initial

  // Collect all incomplete subtasks from active tasks
  const candidates = useMemo(() => {
    const result = [];
    for (const task of tasks) {
      if (task.done) continue;
      for (const sub of task.subs) {
        if (sub.done) continue;
        const dur = parseFloat(sub.dur) || 0;
        if (dur > 0 && dur <= 2) result.push({ sub, task });
      }
    }
    return result;
  }, [tasks]);

  const pick4 = (pool) => {
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4).map(c => c.sub.id);
  };

  const displayIds = picks || (candidates.length > 0 ? pick4(candidates) : []);

  const display = displayIds
    .map(id => candidates.find(c => c.sub.id === id))
    .filter(Boolean);

  // If candidates changed and our picks are stale, reset
  const validDisplay = display.length > 0 ? display : candidates.slice(0, 4);

  if (candidates.length === 0) return null;

  return (
    <div style={{ width: 210, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 12 : 0 }}>
        <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>
            {open ? '▾' : '▸'} Quick wins
          </span>
        </button>
        {open && (
          <button
            onClick={() => setPicks(pick4(candidates))}
            title="Shuffle"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, padding: '2px 4px', lineHeight: 1, transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#9aa1ad'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
          >↺</button>
        )}
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {validDisplay.map(({ sub, task }) => {
            const p = PRI[sub.pri] || PRI.ongoing;
            return (
              <div
                key={sub.id}
                onClick={() => onSelect(task.id)}
                style={{ background: p.tint, border: `1.5px solid ${p.color}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', transition: 'opacity 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flex: 'none' }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: '#9aa1ad', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#edebe5', lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {sub.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 500, color: '#fff', background: PROJ_COLOR[task.project] || PROJ_COLOR.personal }}>{task.project}</span>
                  {sub.dur && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 500, color: '#fff', background: DUR_BRICK }}>{sub.dur}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
