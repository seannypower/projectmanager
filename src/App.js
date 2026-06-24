import { useState, useEffect, useRef } from 'react';
import supabase from './supabase';
import { TaskCard } from './TaskCard';
import { DetailDrawer } from './DetailDrawer';
import { EditDrawer } from './EditDrawer';
import { dueOrdOf, sumHours } from './data';

function move(arr, fromId, toId) {
  const a = arr.slice();
  const fi = a.findIndex(x => x.id === fromId);
  if (fi < 0) return arr;
  const [item] = a.splice(fi, 1);
  const ti = a.findIndex(x => x.id === toId);
  a.splice(ti < 0 ? a.length : ti, 0, item);
  return a;
}

const PROJ_COLOR_MAP = { personal: 'oklch(0.58 0.13 45)', work: 'oklch(0.56 0.13 262)', music: 'oklch(0.44 0.13 240)', video: 'oklch(0.58 0.13 192)' };

function newSubId() { return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

// Write a task + its subtasks to Supabase (for existing tasks only)
async function syncTask(task) {
  const { error } = await supabase.from('tasks').update({
    title: task.title, project: task.project,
    priority: task.priority, due: task.due, est: task.est,
    snooze: task.snooze, notes: task.notes,
  }).eq('id', task.id);
  if (error) { console.error('syncTask:', error); return; }

  // Upsert current subtasks (never deletes all at once — avoids Realtime flash)
  if (task.subs.length > 0) {
    const { error: upsertErr } = await supabase.from('subtasks').upsert(
      task.subs.map((s, i) => ({
        id: s.id, task_id: task.id, name: s.name, pri: s.pri,
        dur: s.dur, due: s.due, done: s.done, notes: s.notes, position: i,
      }))
    );
    if (upsertErr) console.error('syncSubtasks upsert:', upsertErr);
  }

  // Delete only subtasks that were removed
  const keepIds = task.subs.map(s => s.id);
  const deleteQuery = supabase.from('subtasks').delete().eq('task_id', task.id);
  const { error: delErr } = await (keepIds.length > 0
    ? deleteQuery.not('id', 'in', `(${keepIds.join(',')})`)
    : deleteQuery);
  if (delErr) console.error('syncSubtasks delete:', delErr);
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [sortBy, setSortBy] = useState('due');
  const [hidden, setHidden] = useState({});
  const [snoozeOn, setSnoozeOn] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('view');
  const [draft, setDraft] = useState(null);
  const [draftIsNew, setDraftIsNew] = useState(false);
  const [cardPrefs, setCardPrefs] = useState({ project: true, due: true, duration: true, progress: true, notes: true, snooze: true });
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const viewMenuRef = useRef(null);

  // Load tasks from Supabase on mount + subscribe to realtime changes
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, subtasks(*)')
        .is('deleted_at', null)
        .order('id');

      if (error) { console.error('load:', error); setLoading(false); return; }

      const loaded = data.map(t => ({
        ...t,
        subs: (t.subtasks || [])
          .sort((a, b) => a.position - b.position)
          .map(({ id, name, pri, dur, due, done, notes }) => ({ id, name, pri, dur, due, done, notes })),
      }));
      setTasks(loaded);
      setLoading(false);
    }

    load();

    // Re-fetch whenever any task or subtask changes on any device
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ---- derived ----
  const today = (() => { const d = new Date(); return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); })();

  // Close view menu on outside click
  useEffect(() => {
    function handler(e) { if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) setViewMenuOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const cmps = {
    due:      (a, b) => dueOrdOf(a.due) - dueOrdOf(b.due),
    duration: (a, b) => { const va = a.subs.length > 0 ? sumHours(a.subs) : (parseFloat(a.est)||999); const vb = b.subs.length > 0 ? sumHours(b.subs) : (parseFloat(b.est)||999); return va - vb; },
    snooze:   (a, b) => b.snooze - a.snooze || dueOrdOf(a.due) - dueOrdOf(b.due),
    project:  (a, b) => (a.project < b.project ? -1 : a.project > b.project ? 1 : dueOrdOf(a.due) - dueOrdOf(b.due)),
    priority: (a, b) => { const o = { high: 0, ongoing: 1, waiting: 2, norush: 3 }; return (o[a.priority] ?? 1) - (o[b.priority] ?? 1) || dueOrdOf(a.due) - dueOrdOf(b.due); },
  };
  const visible = tasks.filter(t => !hidden[t.project]);
  const active = visible.filter(t => !t.done);
  const completed = visible.filter(t => t.done);
  const sorted = [...active].sort(cmps[sortBy] || cmps.due);
  const colAssign = t => t.priority === 'high' ? 'priority' : t.priority === 'ongoing' ? 'progress' : 'hold';
  const cols = [
    { key: 'priority', label: 'Priority' },
    { key: 'progress', label: 'In Progress' },
    { key: 'hold', label: 'Waiting & Backlog' },
  ].map(c => ({ ...c, items: active.filter(t => colAssign(t) === c.key).sort(cmps[sortBy] || cmps.due) }));

  // ---- mutations ----
  function openNew() {
    setDraft({ id: null, title: '', project: 'personal', priority: 'ongoing', due: '', est: '', snooze: 0, notes: '', subs: [] });
    setDraftIsNew(true);
    setMode('edit');
    setSelected(null);
  }

  function openEdit(taskId) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    setDraft({ ...t, subs: t.subs.map(s => ({ ...s })) });
    setDraftIsNew(false);
    setMode('edit');
    setSelected(taskId);
  }

  async function saveDraft() {
    if (!draft || !draft.title.trim()) return;

    if (draftIsNew) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title: draft.title, project: draft.project, priority: draft.priority, due: draft.due, est: draft.est, snooze: draft.snooze, notes: draft.notes })
        .select()
        .single();
      if (error) { console.error('insert task:', error); return; }

      const newTask = { ...draft, id: data.id };
      if (newTask.subs.length > 0) {
        const { error: subErr } = await supabase.from('subtasks').insert(
          newTask.subs.map((s, i) => ({ id: s.id, task_id: data.id, name: s.name, pri: s.pri, dur: s.dur, due: s.due, done: s.done, notes: s.notes, position: i }))
        );
        if (subErr) console.error('insert subtasks:', subErr);
      }
      setTasks(prev => [...prev, newTask]);
      setSelected(data.id);
    } else {
      await syncTask(draft);
      setTasks(prev => prev.map(t => t.id === draft.id ? draft : t));
      setSelected(draft.id);
    }

    setDraft(null);
    setMode('view');
    setDraftIsNew(false);
  }

  function cancelDraft() {
    setDraft(null);
    setMode('view');
    if (draftIsNew) setSelected(null);
    setDraftIsNew(false);
  }

  async function toggleTaskDone(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const done = !task.done;
    await supabase.from('tasks').update({ done }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t));
    if (done) { setSelected(null); setMode('view'); }
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) { console.error('delete:', error); return; }
    setTasks(prev => prev.filter(t => t.id !== id));
    setDraft(null);
    setMode('view');
    setSelected(null);
    setDraftIsNew(false);
  }

  function closeDrawer() { setSelected(null); setMode('view'); setDraft(null); setDraftIsNew(false); }

  // Patch local state and sync to DB
  function patchAndSync(id, fn) {
    let updated;
    setTasks(prev => {
      const next = prev.map(t => { if (t.id !== id) return t; updated = fn(t); return updated; });
      return next;
    });
    if (updated) syncTask(updated).catch(console.error);
  }

  function patchSub(taskId, subId, patch) {
    patchAndSync(taskId, t => ({ ...t, subs: t.subs.map(s => s.id === subId ? { ...s, ...patch } : s) }));
  }

  const selectedTask = selected != null ? tasks.find(t => t.id === selected) : null;
  const viewOpen = mode === 'view' && selectedTask != null;
  const editOpen = mode === 'edit' && draft != null;
  const anyOpen = viewOpen || editOpen;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#272c34', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#777e8c' }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#272c34', fontFamily: "'Schibsted Grotesk',system-ui,sans-serif", padding: '44px 48px 80px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 26 }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#777e8c', marginBottom: 9 }}>Today · {today}</div>
            <h1 style={{ fontSize: 30, fontWeight: 600, color: '#edebe5', margin: 0, letterSpacing: '-0.022em' }}>Tasks</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={openNew} style={{ border: 'none', cursor: 'pointer', padding: '9px 16px', borderRadius: 9, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 500, background: '#edebe5', color: '#272c34' }}>+ New task</button>
            <div style={{ display: 'inline-flex', background: '#1f232a', borderRadius: 10, padding: 3, gap: 2 }}>
              {['list', 'kanban'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{ border: 'none', cursor: 'pointer', padding: '7px 18px', borderRadius: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 500, letterSpacing: '0.02em', transition: 'background 0.15s, color 0.15s', background: view === v ? '#3a414d' : 'transparent', color: view === v ? '#edebe5' : '#868d99' }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #363c47' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777e8c', marginRight: 3 }}>Show</span>
            {['personal', 'work', 'music', 'video'].map(k => {
              const on = !hidden[k];
              return (
                <button key={k} onClick={() => setHidden(h => ({ ...h, [k]: !h[k] }))} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${on ? '#474e5b' : '#3a414c'}`, background: on ? '#353b46' : 'transparent', color: on ? '#edebe5' : '#7a818d', padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 500, transition: 'all 0.12s' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? PROJ_COLOR_MAP[k] : '#565d69' }} />
                  {k}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSnoozeOn(s => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${snoozeOn ? '#454c5a' : '#3f4654'}`, background: snoozeOn ? '#454c5a' : 'transparent', color: snoozeOn ? '#fff' : '#868d99', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
              ☾ Snooze · {snoozeOn ? 'on' : 'off'}
            </button>
            <div style={{ width: 1, height: 20, background: '#3a414c' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777e8c' }}>Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: '1px solid #474e5b', background: '#343a45', borderRadius: 8, padding: '6px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#edebe5', cursor: 'pointer' }}>
              <option value="due">Due date</option>
              <option value="duration">Duration</option>
              <option value="snooze">Most snoozed</option>
              <option value="project">Project</option>
              <option value="priority">Priority</option>
            </select>
            <div style={{ width: 1, height: 20, background: '#3a414c' }} />
            {/* View menu */}
            <div ref={viewMenuRef} style={{ position: 'relative' }}>
              <button onClick={() => setViewMenuOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: `1px solid ${viewMenuOpen ? '#474e5b' : '#3a414c'}`, background: viewMenuOpen ? '#353b46' : 'transparent', color: viewMenuOpen ? '#edebe5' : '#868d99', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, fontWeight: 500, transition: 'all 0.12s' }}>
                Cards
              </button>
              {viewMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#2f343d', border: '1px solid #474e5b', borderRadius: 10, padding: '6px 4px', zIndex: 50, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {[
                    { key: 'project',  label: 'Category' },
                    { key: 'due',      label: 'Due date' },
                    { key: 'duration', label: 'Duration' },
                    { key: 'progress', label: 'Progress bar' },
                    { key: 'notes',    label: 'Notes' },
                    { key: 'snooze',   label: 'Snooze count' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setCardPrefs(p => ({ ...p, [key]: !p[key] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 12px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 7, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#383e49'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${cardPrefs[key] ? '#6b7686' : '#474e5b'}`, background: cardPrefs[key] ? '#6b7686' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transition: 'all 0.1s' }}>
                        {cardPrefs[key] && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: cardPrefs[key] ? '#edebe5' : '#6b7280' }}>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EMPTY */}
        {active.length === 0 && completed.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: '#777e8c' }}>
            {tasks.length === 0 ? 'No tasks yet — hit + New task.' : 'No tasks — every category is hidden.'}
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div style={{ maxWidth: 560 }}>
            {active.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {sorted.map(t => (
                  <TaskCard key={t.id} task={t} selected={selected === t.id} snoozeOn={snoozeOn} onClick={() => { setSelected(t.id); setMode('view'); }} cardPrefs={cardPrefs} onToggleDone={() => toggleTaskDone(t.id)} />
                ))}
              </div>
            )}

            {/* COMPLETED SECTION */}
            {completed.length > 0 && (
              <div style={{ marginTop: active.length > 0 ? 28 : 0 }}>
                <button
                  onClick={() => setCompletedOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: completedOpen ? 14 : 0 }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280' }}>
                    {completedOpen ? '▾' : '▸'} Completed · {completed.length}
                  </span>
                </button>
                {completedOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11, opacity: 0.6 }}>
                    {completed.map(t => (
                      <TaskCard key={t.id} task={t} selected={selected === t.id} snoozeOn={snoozeOn} onClick={() => { setSelected(t.id); setMode('view'); }} cardPrefs={cardPrefs} onToggleDone={() => toggleTaskDone(t.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* KANBAN VIEW */}
        {view === 'kanban' && visible.length > 0 && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {cols.map(col => (
              <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13, padding: '0 3px' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#868d99' }}>{col.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: '#6b7280' }}>{col.items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {col.items.map(t => (
                    <TaskCard key={t.id} task={t} selected={selected === t.id} snoozeOn={snoozeOn} onClick={() => { setSelected(t.id); setMode('view'); }} kanban cardPrefs={cardPrefs} onToggleDone={() => toggleTaskDone(t.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BACKDROP */}
      {anyOpen && <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,16,0.52)', zIndex: 40 }} />}

      {/* DETAIL DRAWER */}
      {viewOpen && selectedTask && (
        <DetailDrawer
          task={selectedTask}
          onClose={closeDrawer}
          onEdit={() => openEdit(selected)}
          onToggleSub={subId => patchSub(selected, subId, { done: !selectedTask.subs.find(s => s.id === subId)?.done })}
          onReorderSub={(fromId, toId) => patchAndSync(selected, t => ({ ...t, subs: move(t.subs, fromId, toId) }))}
          onSetSubName={(subId, v) => patchSub(selected, subId, { name: v })}
          onSetSubPri={(subId, v) => patchSub(selected, subId, { pri: v })}
          onSetSubDue={(subId, v) => patchSub(selected, subId, { due: v })}
          onSetSubDur={(subId, v) => patchSub(selected, subId, { dur: v })}
          onSetSubNotes={(subId, v) => patchSub(selected, subId, { notes: v })}
        />
      )}

      {/* EDIT DRAWER */}
      {editOpen && draft && (
        <EditDrawer
          draft={draft}
          isNew={draftIsNew}
          onClose={cancelDraft}
          onSave={saveDraft}
          onDelete={() => deleteTask(draft.id)}
          onSetDraft={patch => setDraft(d => ({ ...d, ...patch }))}
          onAddSub={() => setDraft(d => ({ ...d, subs: [...d.subs, { id: newSubId(), name: '', pri: 'ongoing', dur: '', due: '', done: false, notes: '' }] }))}
          onUpdateSub={(subId, patch) => setDraft(d => ({ ...d, subs: d.subs.map(s => s.id === subId ? { ...s, ...patch } : s) }))}
          onRemoveSub={subId => setDraft(d => ({ ...d, subs: d.subs.filter(s => s.id !== subId) }))}
          onReorderSub={(fromId, toId) => setDraft(d => ({ ...d, subs: move(d.subs, fromId, toId) }))}
        />
      )}
    </div>
  );
}
