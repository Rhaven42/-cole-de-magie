import { useMemo, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SPRITES, type SpriteName } from '../assets';
import {
  addedItems,
  addItem,
  itemEdit,
  AREA_ORIGINS,
  DECOR_INDEX,
  OUTDOOR,
  patchItem,
  resetArea,
  resetItem,
  type WallMode,
} from '../data/decorEdits';
import { useGame } from '../state/store';
import { iso, roomSize, unIso } from './iso';
import { stationName } from './kit';
import { radius, space } from './theme';

const STEP = 0.5;
const WALLS: WallMode[] = ['auto', 'face', 'left', 'back'];
const WALL_LABEL: Record<WallMode, string> = {
  auto: '🧱 Auto',
  face: '🧱 De face',
  left: '🧱 Mur gauche',
  back: '🧱 Mur du fond',
};

function areaLabel(area: string): string {
  if (area === OUTDOOR) return 'Extérieur';
  const st = useGame.getState().game.stations[area];
  if (st) return stationName(st);
  return area === 'staff' ? 'Salle des professeurs' : area;
}

/** Zone (salle construite ou extérieur) sous un point de la grille. */
function areaAt(g: { x: number; y: number }): string {
  for (const [id, o] of AREA_ORIGINS) {
    const { w, h } = roomSize(id);
    if (g.x >= o.x && g.x <= o.x + w && g.y >= o.y && g.y <= o.y + h) return id;
  }
  return OUTDOOR;
}

/** Hauteur à l'écran d'un sprite de largeur w. */
function spriteH(name: string, w: number): number {
  const d = SPRITES[name as SpriteName];
  return d ? (w * d.h) / d.w : w;
}

/**
 * Accès à la vue de la carte (zoom, centre de l'écran, blocage du glisser de la carte),
 * fourni par l'écran École.
 */
export const MAP_VIEW = {
  center: () => ({ x: 0, y: 0 }),
};

/** Pose un nouvel objet au point (coordonnées carte) et le sélectionne. */
export function addAt(mx: number, my: number, sprite: string): void {
  const store = useGame.getState();
  const g = unIso(mx, my);
  const area = areaAt(g);
  const o = area === OUTDOOR ? { x: 0, y: 0 } : AREA_ORIGINS.get(area)!;
  const d = SPRITES[sprite as SpriteName];
  const w = Math.round(Math.min(110, Math.max(40, (d?.w ?? 120) / 3)));
  const key = addItem(area, sprite, round(g.x - o.x), round(g.y - o.y), w);
  store.setEditor({ placing: null, sel: `${area}|${key}` });
  store.decorChanged();
}

/** Toucher sur la carte en mode éditeur (coordonnées carte). */
export function editorTap(mx: number, my: number): void {
  const store = useGame.getState();
  const ed = store.editor;
  const g = unIso(mx, my);
  if (ed.placing?.mode === 'add') {
    addAt(mx, my, ed.placing.sprite);
    return;
  }
  if (ed.placing?.mode === 'move' && ed.sel) {
    const it = DECOR_INDEX.get(ed.sel);
    if (it) {
      patchItem(it.area, it.key, { x: round(g.x - it.ox), y: round(g.y - it.oy) });
      store.decorChanged();
    }
    store.setEditor({ placing: null });
    return;
  }
  // Sélection : l'objet le plus en avant sous le doigt.
  let best: { id: string; order: number; size: number } | null = null;
  for (const [id, it] of DECOR_INDEX) {
    const p = iso(it.gx, it.gy);
    const h = spriteH(it.sprite, it.w);
    const pad = 6;
    if (mx < p.x - it.w / 2 - pad || mx > p.x + it.w / 2 + pad) continue;
    if (my < p.y - h - pad || my > p.y + pad) continue;
    const order = it.gx + it.gy;
    const size = it.w * h;
    if (
      !best ||
      order > best.order + 0.01 ||
      (Math.abs(order - best.order) <= 0.01 && size < best.size)
    )
      best = { id, order, size };
  }
  store.setEditor({ sel: best?.id ?? null });
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Décalage (px de carte) de l'objet pendant qu'on le fait glisser. */
const DRAG = new Animated.ValueXY({ x: 0, y: 0 });
let dragKey: string | null = null;

/** Rectangle de prise de l'objet sélectionné (px de carte). */
function grabBox(sel: string | null) {
  const it = sel ? DECOR_INDEX.get(sel) : undefined;
  if (!it) return null;
  const p = iso(it.gx, it.gy);
  const h = spriteH(it.sprite, it.w);
  const bw = Math.max(it.w + 6, 44);
  const bh = Math.max(h + 6, 44);
  return { it, p, h, bw, bh, x0: p.x - bw / 2, y0: p.y - bh + 3 };
}

/** Début d'un glisser sur la carte : true si le doigt est sur l'objet sélectionné. */
export function editorDragStart(mx: number, my: number): boolean {
  const ed = useGame.getState().editor;
  const b = grabBox(ed.on ? ed.sel : null);
  if (!b) return false;
  const pad = 10;
  if (mx < b.x0 - pad || mx > b.x0 + b.bw + pad || my < b.y0 - pad || my > b.y0 + b.bh + pad)
    return false;
  dragKey = ed.sel;
  DRAG.setValue({ x: 0, y: 0 });
  useGame.getState().setEditor({ dragging: true });
  return true;
}

export function editorDragMove(dx: number, dy: number): void {
  if (dragKey) DRAG.setValue({ x: dx, y: dy });
}

/** Fin du glisser : l'objet est posé à sa nouvelle place. */
export function editorDragEnd(dx: number, dy: number): void {
  const key = dragKey;
  dragKey = null;
  DRAG.setValue({ x: 0, y: 0 });
  const store = useGame.getState();
  store.setEditor({ dragging: false });
  const it = key ? DECOR_INDEX.get(key) : undefined;
  if (!it || Math.hypot(dx, dy) < 2) return;
  const p = iso(it.gx, it.gy);
  const to = unIso(p.x + dx, p.y + dy);
  patchItem(it.area, it.key, { x: round(to.x - it.ox), y: round(to.y - it.oy) });
  store.decorChanged();
}

/**
 * Cadre autour de l'objet sélectionné (dans le calque de la carte).
 * On le fait glisser au doigt : l'objet suit, puis se pose au lâcher.
 */
export function EditorMarker() {
  const sel = useGame((s) => (s.editor.on ? s.editor.sel : null));
  const dragging = useGame((s) => !!s.editor.dragging);
  useGame((s) => s.decorRev);
  const b = grabBox(sel);
  if (!b) return null;
  const { it, h, bw, bh } = b;
  const src = SPRITES[it.sprite as SpriteName]?.src;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.marker,
        dragging && styles.markerDrag,
        {
          left: b.x0,
          top: b.y0,
          width: bw,
          height: bh,
          transform: [{ translateX: DRAG.x }, { translateY: DRAG.y }],
        },
      ]}
    >
      {dragging && src ? (
        <Image
          source={src}
          style={{
            position: 'absolute',
            left: (bw - it.w) / 2,
            bottom: 3,
            width: it.w,
            height: h,
            opacity: 0.85,
          }}
          resizeMode="contain"
        />
      ) : null}
      <View style={[styles.foot, { left: bw / 2 - 1, top: bh - 3 }]} />
      {dragging ? null : <Text style={styles.grip}>✥</Text>}
    </Animated.View>
  );
}

/** Barre d'outils de l'éditeur de décor (au-dessus de la carte). */
export function DecorEditorBar() {
  const ed = useGame((s) => s.editor);
  useGame((s) => s.decorRev);
  const store = useGame.getState();
  const [catalog, setCatalog] = useState(false);
  if (!ed.on) return null;
  const it = ed.sel ? DECOR_INDEX.get(ed.sel) : undefined;
  const change = (fn: () => void) => () => {
    fn();
    store.decorChanged();
  };
  const move = (dx: number, dy: number) =>
    change(() => {
      if (!it) return;
      patchItem(it.area, it.key, { x: round(it.gx - it.ox + dx), y: round(it.gy - it.oy + dy) });
    });
  return (
    <>
      <View style={styles.top}>
        <Text style={styles.topTitle}>✏️ Éditeur de décor</Text>
        <Pressable
          style={[styles.tb, { backgroundColor: '#3A9FD9' }]}
          onPress={() => setCatalog(true)}
        >
          <Text style={styles.tbText}>＋ Objet</Text>
        </Pressable>
        <Pressable
          style={[styles.tb, { backgroundColor: '#5FAE3A' }]}
          onPress={() => store.setEditor({ on: false, sel: null, placing: null })}
        >
          <Text style={styles.tbText}>✓ Terminer</Text>
        </Pressable>
      </View>
      {ed.placing ? (
        <View style={styles.hint} pointerEvents="box-none">
          <Text style={styles.hintText}>
            {ed.placing.mode === 'add'
              ? `👆 Touche la carte pour poser : ${ed.placing.sprite}`
              : '👆 Touche l’endroit où déplacer l’objet'}
          </Text>
          <Pressable onPress={() => store.setEditor({ placing: null })}>
            <Text style={styles.hintCancel}>Annuler</Text>
          </Pressable>
        </View>
      ) : !it ? (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>
            👆 Touche un objet puis fais-le glisser avec le doigt. « ＋ Objet » en ajoute un au
            centre.
          </Text>
        </View>
      ) : null}
      {it && !ed.placing ? (
        <View style={styles.panel}>
          <View style={styles.row}>
            <Image
              source={SPRITES[it.sprite as SpriteName]?.src}
              style={styles.thumb}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{it.sprite}</Text>
              <Text style={styles.sub}>
                {areaLabel(it.area)} · taille {Math.round(it.w)}
              </Text>
            </View>
            <Pressable onPress={() => store.setEditor({ sel: null })} style={styles.x}>
              <Text style={styles.tbText}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Tool label="↖" onPress={move(-STEP, 0)} />
            <Tool label="↗" onPress={move(0, -STEP)} />
            <Tool label="↙" onPress={move(0, STEP)} />
            <Tool label="↘" onPress={move(STEP, 0)} />
            <Tool
              label="−"
              onPress={change(() =>
                patchItem(it.area, it.key, { w: Math.max(8, Math.round(it.w / 1.12)) }),
              )}
            />
            <Tool
              label="＋"
              onPress={change(() => patchItem(it.area, it.key, { w: Math.round(it.w * 1.12) }))}
            />
          </View>
          <View style={styles.row}>
            <Tool
              label="⧉ Copier"
              wide
              color="#3A9FD9"
              onPress={() => {
                const key = addItem(
                  it.area,
                  it.sprite,
                  round(it.gx - it.ox + 0.8),
                  round(it.gy - it.oy + 0.8),
                  it.w,
                );
                patchItem(it.area, key, {
                  flip: currentFlip(it.area, it.key),
                  wall: it.wall ?? 'auto',
                });
                store.setEditor({ sel: `${it.area}|${key}` });
                store.decorChanged();
              }}
            />
            <Tool
              label="📍 Placer"
              wide
              onPress={() => store.setEditor({ placing: { mode: 'move' } })}
            />
            <Tool
              label="⇋ Miroir"
              wide
              onPress={change(() =>
                patchItem(it.area, it.key, { flip: !currentFlip(it.area, it.key) }),
              )}
            />
          </View>
          {it.area !== OUTDOOR ? (
            <View style={styles.row}>
              <Tool
                label={WALL_LABEL[it.wall ?? 'auto']}
                wide
                color="#7A5A3A"
                onPress={change(() => {
                  const cur = WALLS.indexOf(it.wall ?? 'auto');
                  patchItem(it.area, it.key, { wall: WALLS[(cur + 1) % WALLS.length] });
                })}
              />
            </View>
          ) : null}
          <View style={styles.row}>
            <Tool
              label="🗑 Supprimer"
              wide
              color="#C0392B"
              onPress={() => {
                patchItem(it.area, it.key, { hidden: true });
                store.setEditor({ sel: null });
                store.decorChanged();
              }}
            />
            {!it.key.startsWith('add-') ? (
              <Tool
                label="↺ D’origine"
                wide
                color="#8A8F94"
                onPress={change(() => resetItem(it.area, it.key))}
              />
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              resetArea(it.area);
              store.setEditor({ sel: null });
              store.decorChanged();
            }}
          >
            <Text style={styles.resetArea}>
              Remettre toute la zone « {areaLabel(it.area)} » d’origine
            </Text>
          </Pressable>
        </View>
      ) : null}
      <Catalog
        open={catalog}
        onClose={() => setCatalog(false)}
        onPick={(sprite) => {
          setCatalog(false);
          // Posé au centre de l'écran et sélectionné : il n'y a plus qu'à le faire glisser.
          const c = MAP_VIEW.center();
          addAt(c.x, c.y + 20, sprite);
        }}
      />
    </>
  );
}

function currentFlip(area: string, key: string): boolean {
  if (key.startsWith('add-')) return !!addedItems(area).find((a) => `add-${a.id}` === key)?.flip;
  return !!itemEdit(area, key)?.flip;
}

function Tool({
  label,
  onPress,
  wide,
  color,
}: {
  label: string;
  onPress: () => void;
  wide?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tool, wide && { flex: 1 }, color ? { backgroundColor: color } : null]}
    >
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

/** Liste de tous les objets existants (sprites du jeu). */
function Catalog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (sprite: string) => void;
}) {
  const [q, setQ] = useState('');
  const names = useMemo(
    () =>
      (Object.keys(SPRITES) as SpriteName[])
        .filter((n) => !q || n.toLowerCase().includes(q.toLowerCase()))
        .sort(),
    [q],
  );
  if (!open) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.catalog}>
        <View style={styles.catHead}>
          <Text style={styles.catTitle}>Objets ({names.length})</Text>
          <Pressable onPress={onClose} style={styles.x}>
            <Text style={styles.tbText}>✕</Text>
          </Pressable>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="🔍 Chercher (ex. candle, tree, desk…)"
          placeholderTextColor="#998"
          style={styles.search}
        />
        <View style={styles.chips}>
          {[
            ['', 'Tous'],
            ['Fond', '🧱 Mur du fond'],
            ['Gauche', '🧱 Mur de gauche'],
          ].map(([v, l]) => (
            <Pressable
              key={l}
              onPress={() => setQ(v)}
              style={[styles.chip, q === v && styles.chipOn]}
            >
              <Text style={styles.chipText}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <FlatList
          data={names}
          numColumns={4}
          keyExtractor={(n) => n}
          contentContainerStyle={{ padding: 6 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun objet ne correspond (les noms sont en anglais).</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.cell} onPress={() => onPick(item)}>
              <Image source={SPRITES[item].src} style={styles.cellImg} resizeMode="contain" />
              <Text style={styles.cellText} numberOfLines={1}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFD23F',
    borderStyle: 'dashed',
    borderRadius: 6,
    backgroundColor: 'rgba(255,210,63,0.12)',
  },
  markerDrag: { borderColor: '#5FE07A', backgroundColor: 'rgba(95,224,122,0.12)' },
  grip: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    color: '#FFD23F',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowRadius: 3,
  },
  foot: {
    position: 'absolute',
    width: 6,
    height: 6,
    marginLeft: -2,
    marginTop: -3,
    borderRadius: 3,
    backgroundColor: '#FFD23F',
  },
  top: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,32,30,0.92)',
    borderRadius: radius.md,
    padding: 6,
  },
  topTitle: { flex: 1, color: '#FFE2C2', fontWeight: '900', fontSize: 14 },
  tb: { borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  tbText: { color: '#fff', fontWeight: '900' },
  hint: {
    position: 'absolute',
    top: 62,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,210,63,0.95)',
    borderRadius: radius.sm,
    padding: 8,
  },
  hintText: { flex: 1, color: '#2B1A0E', fontWeight: '800', fontSize: 12 },
  hintCancel: { color: '#8A2B1A', fontWeight: '900' },
  panel: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(34,32,30,0.95)',
    borderRadius: radius.md,
    padding: space.sm,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thumb: { width: 40, height: 40 },
  name: { color: '#FFD86B', fontWeight: '900' },
  sub: { color: '#BBB', fontSize: 12 },
  x: {
    backgroundColor: '#C0392B',
    borderRadius: 6,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tool: {
    minWidth: 44,
    backgroundColor: '#5E3C8A',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  toolText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  resetArea: { color: '#E07B2E', fontSize: 12, textAlign: 'center', fontWeight: '700', padding: 4 },
  catalog: {
    flex: 1,
    marginTop: 60,
    backgroundColor: '#22201E',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  catHead: { flexDirection: 'row', alignItems: 'center', padding: space.sm },
  catTitle: { flex: 1, color: '#FFE2C2', fontWeight: '900', fontSize: 17 },
  search: {
    backgroundColor: '#FFF8EC',
    borderRadius: radius.sm,
    marginHorizontal: space.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#222',
  },
  cell: {
    flex: 1 / 4,
    margin: 3,
    backgroundColor: '#3A342F',
    borderRadius: 8,
    alignItems: 'center',
    padding: 4,
  },
  cellImg: { width: 60, height: 60 },
  cellText: { color: '#DDD', fontSize: 10 },
  chips: { flexDirection: 'row', gap: 6, paddingHorizontal: space.sm, paddingTop: 6 },
  chip: { backgroundColor: '#3A342F', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  chipOn: { backgroundColor: '#E07B2E' },
  chipText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  empty: { color: '#AAA', textAlign: 'center', marginTop: 30 },
});
