/**
 * Simulateur d'équilibrage (§11).
 * Usage : npm run simulate -- [heures=3] [graine=1]
 * Un « joueur bot » achète la cible du conseiller (salles d'abord, puis le goulot,
 * puis l'amélioration de cours la moins chère). Sort des CSV dans balance-out/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyPurchase,
  collectAll,
  createGame,
  estimatedWait,
  globalTarget,
  populationCap,
  tick,
  type GameState,
} from '../src/engine';

const hours = Number(process.argv[2] ?? 3);
const seed = Number(process.argv[3] ?? 1);
const outDir = join(__dirname, '..', 'balance-out');
mkdirSync(outDir, { recursive: true });

const g: GameState = createGame(seed);
const minuteRows: string[] = [
  'minute,coins,coinsPerMin,students,cap,reputation,purchases,waitReception,waitSorting,waitHall,waitDorms,worstCourseWait',
];
const milestones: string[] = ['event,minute'];
let purchases = 0;
let lastEarned = 0;
const totalSeconds = hours * 3600;

function seen(id: string) {
  return milestones.some((r) => r.startsWith(id + ','));
}

for (let sec = 0; sec < totalSeconds; sec++) {
  for (let q = 0; q < 4; q++) tick(g, 0.25);
  // Le bot récolte ses coffres et agit chaque seconde
  collectAll(g);
  if (g.totals.graduated > 0 && !seen('first-graduate'))
    milestones.push(`first-graduate,${(sec / 60).toFixed(1)}`);
  if (g.totals.graduated >= 10 && !seen('graduates-10'))
    milestones.push(`graduates-10,${(sec / 60).toFixed(1)}`);
  for (let n = 0; n < 5; n++) {
    const target = globalTarget(g);
    if (!target || target.cost > g.coins) break;
    if (!applyPurchase(g, target)) break;
    purchases++;
    if (target.kind === 'course' && !seen(`course-${target.courseId}`))
      milestones.push(`course-${target.courseId},${(sec / 60).toFixed(1)}`);
    if (target.kind === 'dorm') milestones.push(`dorm,${(sec / 60).toFixed(1)}`);
  }
  if ((sec + 1) % 60 === 0) {
    const minute = (sec + 1) / 60;
    const st = g.stations;
    const dorms = Object.values(st).filter((s) => s.kind === 'dorm');
    const courses = Object.values(st).filter((s) => s.kind === 'course');
    minuteRows.push(
      [
        minute,
        Math.round(g.coins),
        g.totals.coinsEarned - lastEarned,
        Object.keys(g.students).length,
        populationCap(g),
        g.reputation.toFixed(1),
        purchases,
        estimatedWait(st.reception).toFixed(0),
        estimatedWait(st.sorting).toFixed(0),
        estimatedWait(st.hall).toFixed(0),
        Math.max(...dorms.map(estimatedWait)).toFixed(0),
        Math.max(...courses.map(estimatedWait)).toFixed(0),
      ].join(','),
    );
    lastEarned = g.totals.coinsEarned;
  }
}

writeFileSync(join(outDir, 'per-minute.csv'), minuteRows.join('\n'));
writeFileSync(join(outDir, 'milestones.csv'), milestones.join('\n'));

const pick = (m: number) => minuteRows[m] ?? minuteRows[minuteRows.length - 1];
console.log(`Simulation ${hours} h, graine ${seed}`);
console.log('Jalons :', milestones.slice(1).join(' | '));
console.log(minuteRows[0]);
for (const m of [1, 2, 5, 10, 15, 30, 60, 120, 180, 300, 600])
  if (m <= hours * 60) console.log(pick(m));
console.log('Totaux :', JSON.stringify(g.totals));
const levels = Object.values(g.stations)
  .map((s) => `${s.id}:L${s.level}/${s.seats.length}p`)
  .join(' ');
console.log('Lieux :', levels);
