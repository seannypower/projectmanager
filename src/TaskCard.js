import { Chip } from './Chip';
import { PRI, PROJ_COLOR, DUE_COLOR, DUR_BRICK, dueOrdOf, dueStateOf, sumHours } from './data';

export function TaskCard({ task, selected, snoozeOn, onClick, kanban, cardPrefs }) {
  const p = PRI[task.priority] || PRI.ongoing;
  const total = task.subs.length;
  const done = task.subs.filter(s => s.done).length;
  const sumH = sumHours(task.subs);
  const ord = dueOrdOf(task.due);
  const dueState = dueStateOf(ord);
  const dueText = dueState === 'overdue' ? (task.due + ' · late') : (task.due || 'no date');
  const durChip = total > 0 ? sumH + 'h' : task.est;
  const subPct = total ? Math.round((done / total) * 100) : 0;
  const showSnooze = snoozeOn && task.snooze > 0;
  const snoozeBg = task.snooze >= 3 ? 'oklch(0.60 0.14 68)' : 'oklch(0.50 0.008 255)';
  const cp = cardPrefs || {};

  const selShadow = selected
    ? `0 0 0 2px ${p.color}, 0 12px 30px rgba(0,0,0,0.34)`
    : kanban ? undefined : 'none';

  const hasAnyChip = cp.project !== false || cp.due !== false || (cp.duration !== false && durChip) || (!kanban && showSnooze && cp.snooze !== false);

  return (
    <div
      onClick={onClick}
      className={kanban ? 'kanban-card' : ''}
      style={{
        background: p.tint, border: `1.5px solid ${p.color}`, borderRadius: 13,
        padding: kanban ? 14 : '14px 16px', cursor: 'pointer',
        boxShadow: selShadow, transition: 'box-shadow 0.15s, transform 0.15s',
      }}
    >
      {kanban ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: p.color }}>{p.label}</span>
            {showSnooze && cp.snooze !== false && <Chip bg={snoozeBg} style={{ padding: '2px 8px', fontSize: 10.5 }}>☾ {task.snooze}</Chip>}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 500, color: '#edebe5', marginTop: 9, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{task.title}</div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15.5, fontWeight: 500, color: '#edebe5', flex: 1, minWidth: 0, letterSpacing: '-0.01em' }}>{task.title}</span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: p.color, whiteSpace: 'nowrap' }}>{p.label}</span>
        </div>
      )}

      {total > 0 && cp.progress !== false && (
        <div style={{ display: 'flex', alignItems: 'center', gap: kanban ? 9 : 10, marginTop: 12 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#20242b', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${subPct}%`, background: p.color, transition: 'width 0.2s' }} />
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#868d99', whiteSpace: 'nowrap' }}>{done}/{total}</span>
        </div>
      )}

      {hasAnyChip && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {cp.project !== false && <Chip bg={PROJ_COLOR[task.project] || PROJ_COLOR.personal}>{task.project}</Chip>}
          {cp.due !== false && <Chip bg={DUE_COLOR[dueState]}>{dueText}</Chip>}
          {cp.duration !== false && durChip && <Chip bg={DUR_BRICK}>{durChip}</Chip>}
          {!kanban && showSnooze && cp.snooze !== false && <Chip bg={snoozeBg}>☾ {task.snooze}</Chip>}
        </div>
      )}

      {task.notes && task.notes.trim() && cp.notes !== false && (
        <div style={{ marginTop: 11, fontSize: 12, color: '#838a96', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.notes}
        </div>
      )}
    </div>
  );
}
