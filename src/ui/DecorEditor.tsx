import { useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

/** Toucher sur la carte en mode éditeur (coordonnées carte). */
export function editorTap(mx: number, my: number): void {
  const store = useGame.getState();
  const ed = store.editor;
  const g = unIso(mx, my);
  if (ed.placing?.mode === 'add') {
    const area = areaAt(g);
    const o = area === OUTDOOR ? { x: 0, y: 0 } : AREA_ORIGINS.get(area)!;
    const d = SPRITES[ed.placing.sprite as SpriteName];
    const w = Math.round(Math.min(90, Math.max(area === OUTDOOR ? 22 : 40, (d?.w ?? 120) / 5)));
    const key = addItem(area, ed.placing.sprite, round(g.x - o.x), round(g.y - o.y), w);
    store.setEditor({ placing: null, sel: `${area}|${key}` });
    store.decorChanged();
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

/** Cadre autour de l'objet sélectionné (dans le calque de la carte). */
export function EditorMarker() {
  const sel = useGame((s) => (s.editor.on ? s.editor.sel : null));
  useGame((s) => s.decorRev);
  if (!sel) return null;
  const it = DECOR_INDEX.get(sel);
  if (!it) return null;
  const p = iso(it.gx, it.gy);
  const h = spriteH(it.sprite, it.w);
  return (
    <View
      pointerEvents="none"
      style={[
        styles.marker,
        { left: p.x - it.w / 2 - 3, top: p.y - h - 3, width: it.w + 6, height: h + 6 },
      ]}
    >
      <View style={[styles.foot, { left: it.w / 2 - 1, top: h }]} />
    </View>
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
            👆 Touche un objet pour le modifier, ou « ＋ Objet » pour en ajouter un.
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
              label="📍 Déplacer"
              wide
              onPress={() => store.setEditor({ placing: { mode: 'move' } })}
            />
            <Tool
              label="⇋ Retourner"
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
          store.setEditor({ placing: { mode: 'add', sprite }, sel: null });
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
