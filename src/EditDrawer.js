import { useRef } from 'react';
import { PRI, PROJ_COLOR, PRIORDER, sumHours } from './data';

function SubEditRow({ sub, onSetName, onSetDur, onSetNotes, onCyclePri, onToggle, onRemove, onDragStart, onDrop }) {
  const p = PRI[sub.pri] || PRI.ongoing;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      style={{ background: '#383e49', border: '1px solid #474e5b', borderRadius: 10, padding: '9px 10px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ color: '#646b78', fontSize: 12, lineHeight: 1, flex: 'none', letterSpacing: 1, cursor: 'grab' }}>⠿</span>
        <span
          onClick={onToggle}
          style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${sub.done ? p.color : '#5a616e'}`, background: sub.done ? p.color : 'transparent', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flex: 'none', cursor: 'pointer' }}
        >{sub.done ? '✓' : ''}</span>
        <input
          value={sub.name}
          onChange={e => onSetName(e.target.value)}
          placeholder="Subtask"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: '#edebe5', fontFamily: "'Schibsted Grotesk',sans-serif", fontSize: 13.5, padding: '2px 0', outline: 'none' }}
        />
        <button
          onClick={onCyclePri}
          title={p.label}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, flex: 'none', display: 'inline-flex' }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: '#2b3038', border: '1px solid #474e5b', borderRadius: 6, padding: '5px 6px', flex: 'none' }}>
          <input
            value={(sub.dur || '').replace(/[a-zA-Z]/g, '')}
            onChange={e => onSetDur(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="2"
            style={{ width: 20, background: 'transparent', border: 'none', color: '#edebe5', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, textAlign: 'center', outline: 'none' }}
          />
          <span style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>hr</span>
        </span>
        <button onClick={onRemove} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#868d99', fontSize: 16, lineHeight: 1, padding: '2px 4px', flex: 'none' }}>×</button>
      </div>
      <input
        value={sub.notes || ''}
        onChange={e => onSetNotes(e.target.value)}
        placeholder="note — shown in full on the card"
        style={{ marginTop: 6, width: '100%', background: 'transparent', border: 'none', color: '#9aa1ad', fontFamily: "'Schibsted Grotesk',sans-serif", fontSize: 12, padding: '2px 0 0 27px', outline: 'none' }}
      />
    </div>
  );
}

export function EditDrawer({ draft, isNew, onClose, onSave, onDelete, onSetDraft, onAddSub, onUpdateSub, onRemoveSub, onReorderSub }) {
  const dragRef = useRef(null);
  const sum = sumHours(draft.subs);
  const hasSubs = draft.subs.length > 0;
  const saveOk = !!draft.title.trim();

  const inputStyle = { width: '100%', background: '#383e49', border: '1px solid #474e5b', borderRadius: 8, padding: '9px 11px', color: '#edebe5', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, outline: 'none' };
  const labelStyle = { fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777e8c', display: 'block', marginBottom: 8 };

  function SegBtn({ label, active, onClick, dot }) {
    return (
      <button
        onClick={onClick}
        style={{
          flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 6px', borderRadius: 8, cursor: 'pointer',
          fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 500,
          transition: 'all 0.12s',
          background: active ? '#3a414d' : 'transparent',
          color: active ? '#edebe5' : '#868d99',
          border: `1px solid ${active ? '#5b6373' : '#3f4654'}`,
        }}
      >
        {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flex: 'none' }} />}
        {label}
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 430, maxWidth: '94vw', background: '#2f343d', boxShadow: '-16px 0 50px rgba(0,0,0,0.4)', zIndex: 41, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '22px 28px 20px', borderBottom: '1px solid #3a414c' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#868d99' }}>{isNew ? 'New task' : 'Edit task'}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: '#868d99', padding: '2px 6px' }}>×</button>
        </div>
        <input
          value={draft.title}
          onChange={e => onSetDraft({ title: e.target.value })}
          placeholder="Task title"
          style={{ width: '100%', background: '#383e49', border: '1px solid #474e5b', borderRadius: 9, padding: '11px 13px', color: '#edebe5', fontFamily: "'Schibsted Grotesk',sans-serif", fontSize: 17, fontWeight: 500, outline: 'none' }}
        />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
        {/* Project */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Project</label>
          <div style={{ display: 'flex', gap: 7 }}>
            {['personal', 'work', 'music', 'video'].map(k => (
              <SegBtn key={k} label={k} active={draft.project === k} dot={PROJ_COLOR[k]} onClick={() => onSetDraft({ project: k })} />
            ))}
          </div>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Priority</label>
          <div style={{ display: 'flex', gap: 7 }}>
            {PRIORDER.map(k => (
              <SegBtn key={k} label={PRI[k].label} active={draft.priority === k} dot={PRI[k].color} onClick={() => onSetDraft({ priority: k })} />
            ))}
          </div>
        </div>

        {/* Due + Duration */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Due</label>
            <input value={draft.due} onChange={e => onSetDraft({ due: e.target.value })} placeholder="Jun 24" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Duration</label>
            {hasSubs ? (
              <div style={{ background: '#2b3038', border: '1px dashed #474e5b', borderRadius: 8, padding: '9px 11px', color: '#868d99', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>auto · {sum} hr</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', background: '#383e49', border: '1px solid #474e5b', borderRadius: 8, padding: '9px 11px', gap: 6 }}>
                <input value={draft.est.replace(/[a-zA-Z]/g, '')} onChange={e => onSetDraft({ est: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="3" style={{ flex: 1, background: 'transparent', border: 'none', color: '#edebe5', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, outline: 'none' }} />
                <span style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>hr</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={draft.notes || ''}
            onChange={e => onSetDraft({ notes: e.target.value })}
            placeholder="Short note — truncated to one line on the card"
            style={{ width: '100%', background: '#383e49', border: '1px solid #474e5b', borderRadius: 8, padding: '9px 11px', color: '#edebe5', fontFamily: "'Schibsted Grotesk',sans-serif", fontSize: 13.5, lineHeight: 1.45, resize: 'vertical', minHeight: 52, outline: 'none' }}
          />
        </div>

        {/* Snooze */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Snoozed</label>
          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #474e5b', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => onSetDraft({ snooze: Math.max(0, draft.snooze - 1) })} style={{ border: 'none', background: '#383e49', color: '#cdd2da', cursor: 'pointer', width: 34, height: 34, fontSize: 16, lineHeight: 1 }}>−</button>
            <span style={{ minWidth: 40, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#edebe5' }}>{draft.snooze}</span>
            <button onClick={() => onSetDraft({ snooze: draft.snooze + 1 })} style={{ border: 'none', background: '#383e49', color: '#cdd2da', cursor: 'pointer', width: 34, height: 34, fontSize: 16, lineHeight: 1 }}>+</button>
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Subtasks</label>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: '#777e8c' }}>{draft.subs.length} {draft.subs.length === 1 ? 'subtask' : 'subtasks'} · {sum} hr</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {draft.subs.map(s => (
              <SubEditRow
                key={s.id}
                sub={s}
                onSetName={v => onUpdateSub(s.id, { name: v })}
                onSetDur={v => onUpdateSub(s.id, { dur: v })}
                onSetNotes={v => onUpdateSub(s.id, { notes: v })}
                onCyclePri={() => { const i = PRIORDER.indexOf(s.pri); onUpdateSub(s.id, { pri: PRIORDER[(i + 1) % 4] }); }}
                onToggle={() => onUpdateSub(s.id, { done: !s.done })}
                onRemove={() => onRemoveSub(s.id)}
                onDragStart={e => { dragRef.current = s.id; try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', s.id); } catch (_) {} }}
                onDrop={() => { if (dragRef.current) { onReorderSub(dragRef.current, s.id); dragRef.current = null; } }}
              />
            ))}
          </div>
          <button
            onClick={onAddSub}
            style={{ marginTop: 9, width: '100%', border: '1px dashed #4d5462', background: 'transparent', color: '#9aa1ad', cursor: 'pointer', padding: 9, borderRadius: 9, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, transition: 'all 0.12s' }}
          >+ Add subtask</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 28px', borderTop: '1px solid #3a414c' }}>
        {!isNew && (
          <button onClick={onDelete} style={{ border: 'none', background: 'transparent', color: 'oklch(0.62 0.17 27)', cursor: 'pointer', padding: '9px 12px', borderRadius: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 500 }}>Delete</button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ border: '1px solid #474e5b', background: 'transparent', color: '#cdd2da', cursor: 'pointer', padding: '9px 18px', borderRadius: 9, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 500 }}>Cancel</button>
        <button
          onClick={saveOk ? onSave : undefined}
          style={{ border: 'none', cursor: saveOk ? 'pointer' : 'default', padding: '9px 20px', borderRadius: 9, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 500, background: saveOk ? '#edebe5' : '#3a414d', color: saveOk ? '#272c34' : '#6b7280' }}
        >Save</button>
      </div>
    </div>
  );
}
