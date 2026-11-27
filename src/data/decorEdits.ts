/**
 * Modifications du décor faites dans l'éditeur (administration) :
 * objets déplacés, redimensionnés, retournés, masqués, ou ajoutés.
 *
 * Une « zone » est une salle (id du lieu) ou « outdoor » (l'extérieur).
 * Dans une salle, les positions sont relatives à l'origine de la salle (en cases) ;
 * dehors, elles sont absolues.
 */
export interface ItemEdit {
  x?: number;
  y?: number;
  w?: number;
  /** Inverse le sens de l'objet. */
  flip?: boolean;
  hidden?: boolean;
  /** Contre un mur : plaqué (incliné) contre le mur de gauche ou du fond, ou de face. */
  wall?: WallMode;
}

export type WallMode = 'auto' | 'face' | 'left' | 'back';

export interface AddedItem {
  id: string;
  sprite: string;
  x: number;
  y: number;
  w: number;
  flip?: boolean;
  wall?: WallMode;
}

export interface AreaEdits {
  items: Record<string, ItemEdit>;
  added: AddedItem[];
}

export type DecorEdits = Record<string, AreaEdits>;

export const OUTDOOR = 'outdoor';

let edits: DecorEdits = {};

export function getDecorEdits(): DecorEdits {
  return edits;
}

export function setDecorEdits(e: DecorEdits): void {
  edits = e && typeof e === 'object' ? e : {};
}

function area(a: string): AreaEdits {
  if (!edits[a]) edits = { ...edits, [a]: { items: {}, added: [] } };
  return edits[a];
}

export function itemEdit(a: string, key: string): ItemEdit | undefined {
  return edits[a]?.items[key];
}

export function addedItems(a: string): AddedItem[] {
  return edits[a]?.added ?? [];
}

/** Modifie un objet d'origine (clé) ou un objet ajouté (clé `add-<id>`). */
export function patchItem(a: string, key: string, patch: ItemEdit): void {
  const ar = area(a);
  if (key.startsWith('add-')) {
    const id = key.slice(4);
    const added = ar.added
      .map((it) => {
        if (it.id !== id) return it;
        return {
          ...it,
          x: patch.x ?? it.x,
          y: patch.y ?? it.y,
          w: patch.w ?? it.w,
          flip: patch.flip ?? it.flip,
          wall: patch.wall ?? it.wall,
        };
      })
      .filter((it) => !(it.id === id && patch.hidden));
    edits = { ...edits, [a]: { ...ar, added } };
    return;
  }
  edits = {
    ...edits,
    [a]: { ...ar, items: { ...ar.items, [key]: { ...ar.items[key], ...patch } } },
  };
}

/** Rétablit un objet d'origine. */
export function resetItem(a: string, key: string): void {
  const ar = edits[a];
  if (!ar) return;
  const items = { ...ar.items };
  delete items[key];
  edits = { ...edits, [a]: { ...ar, items } };
}

let seq = 0;
export function addItem(a: string, sprite: string, x: number, y: number, w: number): string {
  const ar = area(a);
  const id = `${Date.now().toString(36)}${(seq++).toString(36)}`;
  edits = { ...edits, [a]: { ...ar, added: [...ar.added, { id, sprite, x, y, w }] } };
  return `add-${id}`;
}

/** Rétablit toute une zone (ou tout le décor si `a` est absent). */
export function resetArea(a?: string): void {
  if (!a) {
    edits = {};
    return;
  }
  const next = { ...edits };
  delete next[a];
  edits = next;
}

export function countEdits(): number {
  return Object.values(edits).reduce(
    (n, ar) => n + Object.keys(ar.items).length + ar.added.length,
    0,
  );
}

/** Objet dessiné sur la carte (index pour la sélection dans l'éditeur). */
export interface PlacedDecor {
  area: string;
  key: string;
  sprite: string;
  /** Position absolue (cases). */
  gx: number;
  gy: number;
  w: number;
  /** Origine de la zone (cases) : pour convertir en position relative. */
  ox: number;
  oy: number;
  /** Décalage d'affichage vertical (px) du sprite. */
  lift?: number;
  wall?: WallMode;
}

/** Rempli à chaque dessin de la carte. */
export const DECOR_INDEX = new Map<string, PlacedDecor>();
/** Origines des zones dessinées (salles construites). */
export const AREA_ORIGINS = new Map<string, { x: number; y: number }>();
