export const INITIAL_TASKS = [
  { id: 1, title: 'build productivity tool', project: 'personal', priority: 'high',    due: 'Jun 24', est: '3h', snooze: 0, notes: 'MVP: quick capture + list view first', subs: [] },
  { id: 2, title: 'kitchen reno',            project: 'personal', priority: 'ongoing', due: 'Jun 28', est: '',   snooze: 1, notes: 'waiting on contractor quote', subs: [
    { id: 'k1', name: 'counters',    pri: 'ongoing', dur: '4h', due: 'Jun 26', done: true,  notes: 'quartz, matte — measure twice before ordering' },
    { id: 'k2', name: 'backsplash',  pri: 'norush',  dur: '3h', due: '',       done: false, notes: '' },
    { id: 'k3', name: 'copper wall', pri: 'high',    dur: '6h', due: 'Jun 27', done: false, notes: 'patina sample ordered, ETA next week' },
    { id: 'k4', name: 'pulls',       pri: 'norush',  dur: '1h', due: '',       done: false, notes: '' },
  ]},
  { id: 3, title: 'studio rental',           project: 'work',     priority: 'ongoing', due: 'Jun 25', est: '',   snooze: 0, notes: 'list on Peerspace + Giggster', subs: [
    { id: 's1', name: 'clean',            pri: 'ongoing', dur: '2h', due: 'Jun 24', done: false, notes: '' },
    { id: 's2', name: 'stain',            pri: 'ongoing', dur: '3h', due: '',       done: false, notes: 'dark walnut to match the floors' },
    { id: 's3', name: 'rental interface', pri: 'high',    dur: '5h', due: 'Jun 28', done: false, notes: 'booking calendar + deposit flow + house rules' },
  ]},
  { id: 4, title: 'jess epk',                project: 'work',     priority: 'ongoing', due: 'Jun 30', est: '4h', snooze: 1, notes: '', subs: [] },
  { id: 5, title: 'ben epk',                 project: 'work',     priority: 'waiting', due: 'Jun 20', est: '2h', snooze: 4, notes: 'needs updated headshots from the shoot', subs: [] },
  { id: 6, title: 'bamboo headboard build',  project: 'personal', priority: 'norush',  due: 'Aug 15', est: '6h', snooze: 3, notes: '', subs: [] },
  { id: 7, title: 'sell extra gear',         project: 'work',     priority: 'norush',  due: 'Jul 10', est: '1h', snooze: 2, notes: 'post to Reverb + local pickup', subs: [] },
];

export const PRI = {
  high:    { color: 'oklch(0.66 0.19 28)',  tint: 'oklch(0.345 0.045 28)',  label: 'priority' },
  ongoing: { color: 'oklch(0.66 0.13 250)', tint: 'oklch(0.345 0.035 250)', label: 'ongoing' },
  waiting: { color: 'oklch(0.74 0.14 80)',  tint: 'oklch(0.36 0.040 80)',   label: 'waiting' },
  norush:  { color: 'oklch(0.72 0.05 165)', tint: 'oklch(0.345 0.016 200)', label: 'no rush' },
};

export const PROJ_COLOR = {
  personal: 'oklch(0.58 0.13 45)',
  work: 'oklch(0.56 0.13 262)',
};

export const DUE_COLOR = {
  overdue: 'oklch(0.58 0.19 27)',
  soon: 'oklch(0.62 0.15 60)',
  normal: 'oklch(0.52 0.02 255)',
};

export const DUR_BRICK = 'oklch(0.52 0.014 255)';

export const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

export function dueOrdOf(due) {
  if (!due) return 9999;
  const m = due.trim().toLowerCase().match(/([a-z]{3})\s*(\d{1,2})/);
  if (!m || !MONTHS[m[1]]) return 9999;
  return MONTHS[m[1]] * 100 + parseInt(m[2], 10);
}

export function todayOrd() {
  const now = new Date();
  return (now.getMonth() + 1) * 100 + now.getDate();
}

export function dueStateOf(ord) {
  const today = todayOrd();
  if (ord >= 9999) return 'normal';
  if (ord < today) return 'overdue';
  if (ord <= today + 3) return 'soon';
  return 'normal';
}

export function sumHours(subs) {
  return subs.reduce((a, s) => a + (parseFloat(s.dur) || 0), 0);
}

export const PRIORDER = ['high', 'ongoing', 'waiting', 'norush'];
