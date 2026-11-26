import { tick } from '../tick';
import { addStudent, quietGame, run } from './helpers';

describe('files d’attente', () => {
  it('un nouvel élève rejoint la file de l’Accueil', () => {
    const g = quietGame();
    const s = addStudent(g);
    expect(g.stations.reception.queue).toEqual([s.id]);
    expect(s.activity.mode).toBe('queue');
  });

  it('FIFO : le premier arrivé est servi au premier guichet', () => {
    const g = quietGame();
    const a = addStudent(g);
    const b = addStudent(g);
    tick(g);
    expect(g.stations.reception.seats[0].occupant).toBe(a.id);
    expect(g.stations.reception.queue).toEqual([b.id]);
  });

  it('inscription (8 s) puis file du Salon des Destinées', () => {
    const g = quietGame();
    const a = addStudent(g);
    run(g, 8.25);
    expect(a.activity).toMatchObject({ stationId: 'sorting' });
    expect(g.stations.reception.stats.served).toBe(1);
    expect(g.reputation).toBeGreaterThan(0);
  });

  it('un élève trop longtemps en file à l’Accueil s’en va (réputation −)', () => {
    const g = quietGame();
    g.reputation = 5;
    addStudent(g); // servi
    const waiting = addStudent(g);
    // Bloque le guichet artificiellement
    tick(g);
    g.stations.reception.seats[0].remaining = 1e6;
    const events = run(g, 50);
    expect(g.students[waiting.id]).toBeUndefined();
    expect(events.some((e) => e.type === 'left')).toBe(true);
    expect(g.reputation).toBeLessThan(5);
    expect(g.totals.left).toBe(1);
  });

  it('la salle d’attente augmente la patience', () => {
    const g = quietGame();
    g.stations.reception.tracks.waitingRoom = 2; // +30 s
    addStudent(g);
    const waiting = addStudent(g);
    tick(g);
    g.stations.reception.seats[0].remaining = 1e6;
    run(g, 50);
    expect(g.students[waiting.id]).toBeDefined();
  });

  it('attendre trop au Salon fait baisser l’humeur sans faire partir', () => {
    const g = quietGame();
    const s = addStudent(g, { mood: 70 });
    g.stations.reception.queue = [];
    g.stations.sorting.queue.push(s.id);
    s.activity = { mode: 'queue', stationId: 'sorting', since: g.time };
    g.stations.sorting.seats[0].occupant = 9999;
    g.stations.sorting.seats[0].remaining = 1e6;
    run(g, 40);
    expect(g.students[s.id]).toBeDefined();
    expect(s.mood).toBeLessThan(70);
  });

  it('les arrivées s’arrêtent au plafond de population', () => {
    const g = quietGame();
    g.arrivalTimer = 0;
    run(g, 600);
    expect(Object.keys(g.students).length).toBeLessThanOrEqual(14);
    expect(g.totals.arrived).toBeGreaterThan(0);
  });

  it('ignore les identifiants orphelins dans une file', () => {
    const g = quietGame();
    g.stations.reception.queue.push(12345);
    const s = addStudent(g);
    tick(g);
    expect(g.stations.reception.seats[0].occupant).toBe(s.id);
  });
});
