import { useRef, useState } from 'react';
import { Chip } from './Chip';
import { PRI, PROJ_COLOR, DUE_COLOR, DUR_BRICK, dueOrdOf, dueStateOf, sumHours, PRIORDER } from './data';

function SubRow({ sub, taskPriColor, isUserSort, draggingId, onToggle, onSetName, onSetPri, onSetDue, onSetDur, onSetNotes, onDragStart, onDragOver, onDragEnd }) {
  const [editingName, setEditingName] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [editingDur, setEditingDur] = useState(false);
  const p = PRI[sub.pri] || PRI.ongoing;
  const isDragging = draggingId === sub.id;

  return (
    <div
      draggable={isUserSort}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={e => e.preventDefault()}
      style={{
        background: '#383e49', border: '1px solid #474e5b', borderRadius: 10, padding: '11px 12px',
        cursor: isUserSort ? 'grab' : 'default',
        opacity: isDragging ? 0.35 : 1,
        transform: isDragging ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 0.12s, transform 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        {isUserSort && <span style={{ color: '#646b78', fontSize: 12, lineHeight: 1, flex: 'none', letterSpacing: 1 }}>⠿</span>}
        <span
          onClick={onToggle}
          style={{
            width: 19, height: 19, borderRadius: 6,
            border: `1.5px solid ${sub.done ? p.color : '#5a616e'}`,
            background: sub.done ? p.color : 'transparent',
            color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, flex: 'none', cursor: 'pointer',
          }}
        >{sub.done ? '✓' : ''}</span>

        {editingName ? (
          <input
            autoFocus
            defaultValue={sub.name}
            onChange={e => onSetName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
            style={{ flex: 1, minWidth: 0, fontSize: 14, color: '#edebe5', background: '#2b3038', border: '1px solid #5b6373', borderRadius: 6, padding: '6px 8px', fontFamily: "'Schibsted Grotesk',sans-serif" }}
          />
        ) : (
          <span
            onClick={() => setEditingName(true)}
            style={{ flex: 1, minWidth: 0, fontSize: 14, color: sub.done ? '#868d99' : '#edebe5', textDecoration: sub.done ? 'line-through' : 'none', cursor: 'text' }}
          >{sub.name}</span>
        )}

        <select
          value={sub.pri}
          onChange={e => onSetPri(e.target.value)}
          style={{ border: '1px solid #5a616e', background: 'transparent', color: p.color, borderRadius: 6, padding: '3px 6px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 500, cursor: 'pointer', flex: 'none' }}
        >
          {PRIORDER.map(k => <option key={k} value={k}>{PRI[k].label}</option>)}
        </select>

        <input
          value={sub.due}
          onChange={e => onSetDue(e.target.value)}
          placeholder="due"
          style={{ width: 50, background: '#2b3038', border: '1px solid #474e5b', borderRadius: 6, color: '#edebe5', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: '4px 6px', flex: 'none' }}
        />

        {editingDur ? (
          <input
            autoFocus
            defaultValue={sub.dur}
            onChange={e => onSetDur(e.target.value)}
            onBlur={() => setEditingDur(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingDur(false); }}
            style={{ width: 46, background: '#2b3038', border: '1px solid #5b6373', borderRadius: 6, color: '#fff', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, fontWeight: 500, padding: '3px 8px', flex: 'none', outline: 'none', textAlign: 'center' }}
          />
        ) : (
          <span onClick={() => setEditingDur(true)} style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, fontWeight: 500, color: '#fff', background: DUR_BRICK, flex: 'none', cursor: 'text' }}>{sub.dur || '—'}</span>
        )}
      </div>

      {editingNote ? (
        <input
          autoFocus
          defaultValue={sub.notes}
          onChange={e => onSetNotes(e.target.value)}
          onBlur={() => setEditingNote(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingNote(false); }}
          placeholder="add a note…"
          style={{ marginTop: 8, width: '100%', paddingLeft: 30, background: 'transparent', border: 'none', color: '#9aa1ad', fontFamily: "'Schibsted Grotesk',sans-serif", fontSize: 12.5, lineHeight: 1.45, outline: 'none' }}
        />
      ) : (
        <div
          onClick={() => setEditingNote(true)}
          style={{ marginTop: 8, paddingLeft: 30, fontSize: 12.5, color: sub.notes ? '#9aa1ad' : '#4d5462', lineHeight: 1.45, cursor: 'text' }}
        >{sub.notes || 'add a note…'}</div>
      )}
    </div>
  );
}

export function DetailDrawer({ task, onClose, onEdit, onToggleSub, onReorderSub, onSetSubName, onSetSubPri, onSetSubDue, onSetSubDur, onSetSubNotes }) {
  const [subSortBy, setSubSortBy] = useState('user');
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef(null);
  const lastDragOver = useRef(null);

  const p = PRI[task.priority] || PRI.ongoing;
  const total = task.subs.length;
  const done = task.subs.filter(s => s.done).length;
  const sumH = sumHours(task.subs);
  const ord = dueOrdOf(task.due);
  const dueState = dueStateOf(ord);
  const dueText = dueState === 'overdue' ? (task.due + ' · late') : (task.due || 'no date');
  const durChip = total > 0 ? sumH + 'h' : task.est;
  const subPct = total ? Math.round((done / total) * 100) : 0;
  const snoozeBg = task.snooze >= 3 ? 'oklch(0.60 0.14 68)' : 'oklch(0.50 0.008 255)';

  const subSortCmps = {
    due:      (a, b) => dueOrdOf(a.due || '') - dueOrdOf(b.due || ''),
    duration: (a, b) => (parseFloat(b.dur) || 0) - (parseFloat(a.dur) || 0),
    priority: (a, b) => PRIORDER.indexOf(a.pri) - PRIORDER.indexOf(b.pri),
  };
  const isUserSort = subSortBy === 'user';
  const displaySubs = isUserSort ? task.subs : [...task.subs].sort(subSortCmps[subSortBy]);

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 402, maxWidth: '92vw', background: '#2f343d', boxShadow: '-16px 0 50px rgba(0,0,0,0.4)', zIndex: 41, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px 22px', borderBottom: '1px solid #3a414c' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: p.color }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            {p.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onEdit} style={{ border: '1px solid #474e5b', background: 'transparent', color: '#cdd2da', cursor: 'pointer', padding: '5px 13px', borderRadius: 7, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 500 }}>Edit</button>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: '#868d99', padding: '2px 6px' }}>×</button>
          </div>
        </div>
        <div style={{ fontSize: 21, fontWeight: 600, color: '#edebe5', marginTop: 12, letterSpacing: '-0.018em', lineHeight: 1.25 }}>{task.title}</div>
        {task.notes && task.notes.trim() && (
          <div style={{ fontSize: 13.5, color: '#9aa1ad', marginTop: 8, lineHeight: 1.5 }}>{task.notes}</div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          <Chip bg={PROJ_COLOR[task.project] || PROJ_COLOR.personal}>{task.project}</Chip>
          <Chip bg={DUE_COLOR[dueState]}>{dueText}</Chip>
          {durChip && <Chip bg={DUR_BRICK}>{durChip}</Chip>}
          {task.snooze > 0 && <Chip bg={snoozeBg}>☾ {task.snooze} snoozed</Chip>}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {total > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#868d99' }}>Subtasks</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777e8c' }}>Sort</span>
                <select value={subSortBy} onChange={e => setSubSortBy(e.target.value)} style={{ border: '1px solid #474e5b', background: '#383e49', borderRadius: 6, padding: '4px 8px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: '#edebe5', cursor: 'pointer' }}>
                  <option value="user">User</option>
                  <option value="due">Due date</option>
                  <option value="duration">Duration</option>
                  <option value="priority">Priority</option>
                </select>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#777e8c' }}>{done}/{total} · {sumH}h</span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: '#20242b', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${subPct}%`, background: p.color, transition: 'width 0.25s' }} />
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#6b7280', marginBottom: 16, letterSpacing: '0.04em' }}>Drag to reorder · click to complete</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displaySubs.map(sub => (
                <SubRow
                  key={sub.id}
                  sub={sub}
                  taskPriColor={p.color}
                  isUserSort={isUserSort}
                  draggingId={draggingId}
                  onToggle={() => onToggleSub(sub.id)}
                  onSetName={v => onSetSubName(sub.id, v)}
                  onSetPri={v => onSetSubPri(sub.id, v)}
                  onSetDue={v => onSetSubDue(sub.id, v)}
                  onSetDur={v => onSetSubDur(sub.id, v)}
                  onSetNotes={v => onSetSubNotes(sub.id, v)}
                  onDragStart={e => {
                    dragRef.current = sub.id;
                    lastDragOver.current = sub.id;
                    setDraggingId(sub.id);
                    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', sub.id); } catch (_) {}
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    if (dragRef.current && dragRef.current !== sub.id && lastDragOver.current !== sub.id) {
                      lastDragOver.current = sub.id;
                      onReorderSub(dragRef.current, sub.id);
                    }
                  }}
                  onDragEnd={() => { dragRef.current = null; lastDragOver.current = null; setDraggingId(null); }}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: '14px 0', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: '#777e8c', lineHeight: 1.6 }}>
            No subtasks on this one.<br />Hit Edit to add some.
          </div>
        )}
      </div>
    </div>
  );
}
