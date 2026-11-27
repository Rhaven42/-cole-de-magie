import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { COURSE_IDS } from '../data/courses';
import { ADMIN_CODE, applyTuning, DEFAULTS, PARAMS, paramValue } from '../data/tuning';
import { buyCourse, buyExam, catchUp, courseCost, examCost } from '../engine';
import { loadTuning, writeTuning } from '../state/persistence';
import { useGame } from '../state/store';
import {
  countEdits,
  getDecorEdits,
  resetArea,
  setDecorEdits,
  type DecorEdits,
} from '../data/decorEdits';
import { formatNumber, radius, space } from '../ui/theme';

type Tab = 'cheats' | 'decor' | 'tuning' | 'export';
let unlocked = false;

/**
 * Interface d'administration : triche pour tester, réglages de l'équilibrage
 * (enregistrés sur l'appareil) et export / import des réglages en JSON.
 */
export function AdminPanel() {
  const open = useGame((s) => s.panel === 'admin');
  const store = useGame.getState();
  const [ok, setOk] = useState(unlocked);
  const [code, setCode] = useState('');
  const [tab, setTab] = useState<Tab>('cheats');
  const [over, setOver] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (open) loadTuning().then(setOver);
  }, [open]);
  if (!open) return null;
  const close = () => store.openPanel(null);
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 1800);
  };
  const save = (next: Record<string, number>) => {
    setOver(next);
    applyTuning(next);
    writeTuning(next);
    store.refresh();
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <View style={styles.sheet}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>🛠️ Administration</Text>
          <Pressable onPress={close} style={styles.close} accessibilityLabel="Fermer">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        {!ok ? (
          <View style={styles.lock}>
            <Text style={styles.label}>Code d’accès</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              secureTextEntry
              keyboardType="number-pad"
              style={styles.input}
              onSubmitEditing={() => {
                if (code === ADMIN_CODE) {
                  unlocked = true;
                  setOk(true);
                } else flash('Code incorrect');
              }}
            />
            <Btn
              label="Entrer"
              onPress={() => {
                if (code === ADMIN_CODE) {
                  unlocked = true;
                  setOk(true);
                } else flash('Code incorrect');
              }}
            />
          </View>
        ) : (
          <>
            <View style={styles.tabs}>
              {(
                [
                  ['cheats', '🎮 Triche'],
                  ['decor', '🏰 Décor'],
                  ['tuning', '⚙️ Réglages'],
                  ['export', '📤 Export'],
                ] as [Tab, string][]
              ).map(([k, l]) => (
                <Pressable
                  key={k}
                  onPress={() => setTab(k)}
                  style={[styles.tab, tab === k && styles.tabOn]}
                >
                  <Text style={styles.tabText}>{l}</Text>
                </Pressable>
              ))}
            </View>
            {tab === 'cheats' ? <Cheats flash={flash} /> : null}
            {tab === 'decor' ? <DecorTab flash={flash} /> : null}
            {tab === 'tuning' ? <Tuning over={over} save={save} /> : null}
            {tab === 'export' ? <Export over={over} save={save} flash={flash} /> : null}
          </>
        )}
        {msg ? (
          <View style={styles.toast} pointerEvents="none">
            <Text style={styles.toastText}>{msg}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function Btn({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable style={[styles.btn, color ? { backgroundColor: color } : null]} onPress={onPress}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

function Cheats({ flash }: { flash: (m: string) => void }) {
  const store = useGame.getState();
  const act =
    (label: string, fn: (g: ReturnType<typeof useGame.getState>['game']) => void) => () => {
      fn(useGame.getState().game);
      store.refresh();
      flash(label);
    };
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.h}>Monnaies</Text>
      <View style={styles.row}>
        {[1e3, 1e6, 1e9].map((n) => (
          <Btn
            key={n}
            label={`+${formatNumber(n)} 💰`}
            onPress={act(`+${formatNumber(n)} Éclats`, (g) => {
              g.coins += n;
            })}
          />
        ))}
      </View>
      <View style={styles.row}>
        {[10, 100, 1000].map((n) => (
          <Btn
            key={n}
            color="#3A9FD9"
            label={`+${n} 💎`}
            onPress={act(`+${n} Diamants`, (g) => {
              g.gems += n;
            })}
          />
        ))}
      </View>
      <Btn
        color="#8A8F94"
        label="Remettre Éclats et Diamants à 0"
        onPress={act('Remis à zéro', (g) => {
          g.coins = 0;
          g.gems = 0;
        })}
      />
      <Text style={styles.h}>Temps</Text>
      <View style={styles.row}>
        {[600, 3600].map((s) => (
          <Btn
            key={s}
            color="#5E3C8A"
            label={`Avancer de ${s / 60} min`}
            onPress={act(`+${s / 60} min de jeu`, (g) => {
              catchUp(g, s);
              if (g.treeReadyAt) g.treeReadyAt -= s * 1000;
            })}
          />
        ))}
      </View>
      <Btn
        color="#5E3C8A"
        label="🌳 Faire mûrir l’Arbre enchanté"
        onPress={act('Le fruit est mûr', (g) => {
          g.treeReadyAt = 0;
        })}
      />
      <Btn
        color="#5E3C8A"
        label="🎁 Faire apparaître un bonus pub"
        onPress={act('Bonus disponible', (g) => {
          g.ad = { nextAt: g.time, kind: g.ad?.kind ?? 'coins' };
        })}
      />
      <Text style={styles.h}>École</Text>
      <Btn
        label="🏰 Ouvrir toutes les salles (gratuit)"
        onPress={act('Toutes les salles sont ouvertes', (g) => {
          for (const id of COURSE_IDS) {
            const c = courseCost(g, id);
            if (c === null || g.stations[`course-${id}`]) continue;
            g.coins += c;
            buyCourse(g, id);
          }
          const e = examCost(g);
          if (e !== null) {
            g.coins += e;
            buyExam(g);
          }
        })}
      />
      <Btn
        color="#C0392B"
        label="Vider les achats de la boutique 💎"
        onPress={act('Achats 💎 effacés', (g) => {
          g.gemShop = {};
        })}
      />
    </ScrollView>
  );
}

function DecorTab({ flash }: { flash: (m: string) => void }) {
  const store = useGame.getState();
  useGame((s) => s.decorRev);
  const n = countEdits();
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.note}>
        Modifie toi-même les salles et l’extérieur : touche un objet pour le déplacer, l’agrandir,
        le retourner ou le supprimer ; ajoute n’importe quel objet du jeu depuis la liste. Les
        meubles où s’installent les élèves se déplacent avec « Réaménager » dans chaque salle.
      </Text>
      <Btn
        label="✏️ Ouvrir l’éditeur de décor"
        onPress={() => {
          store.openPanel(null);
          store.setEditor({ on: true, sel: null, placing: null });
        }}
      />
      <Text style={styles.note}>
        {n} modification{n > 1 ? 's' : ''} du décor enregistrée{n > 1 ? 's' : ''} sur cet appareil.
      </Text>
      {n ? (
        <Btn
          color="#C0392B"
          label="Remettre tout le décor d’origine"
          onPress={() => {
            resetArea();
            store.decorChanged();
            flash('Décor d’origine rétabli');
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function Tuning({
  over,
  save,
}: {
  over: Record<string, number>;
  save: (o: Record<string, number>) => void;
}) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const m = new Map<string, typeof PARAMS>();
    for (const p of PARAMS) {
      if (q && !`${p.group} ${p.label}`.toLowerCase().includes(q.toLowerCase())) continue;
      m.set(p.group, [...(m.get(p.group) ?? []), p]);
    }
    return [...m.entries()];
  }, [q]);
  const changed = Object.keys(over).length;
  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.note}>
        Les valeurs modifiées (en orange) s’appliquent tout de suite et restent enregistrées sur cet
        appareil. {changed} réglage{changed > 1 ? 's' : ''} modifié{changed > 1 ? 's' : ''}.
      </Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="🔍 Chercher un réglage…"
        placeholderTextColor="#998"
        style={styles.input}
      />
      {groups.map(([g, ps]) => (
        <View key={g}>
          <Text style={styles.h}>{g}</Text>
          {ps.map((p) => (
            <Field
              key={p.id}
              label={p.label}
              unit={p.unit}
              value={paramValue(p.id)}
              def={DEFAULTS[p.id]}
              changed={p.id in over}
              onSet={(v) => {
                const next = { ...over };
                if (v === null || v === DEFAULTS[p.id]) delete next[p.id];
                else next[p.id] = v;
                save(next);
              }}
            />
          ))}
        </View>
      ))}
      {changed ? (
        <Btn color="#C0392B" label="Tout remettre d’origine" onPress={() => save({})} />
      ) : null}
    </ScrollView>
  );
}

function Field({
  label,
  unit,
  value,
  def,
  changed,
  onSet,
}: {
  label: string;
  unit?: string;
  value: number;
  def: number;
  changed: boolean;
  onSet: (v: number | null) => void;
}) {
  const [txt, setTxt] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setTxt(String(value));
  }
  const commit = () => {
    const v = Number(txt.replace(',', '.').replace(/\s/g, ''));
    if (Number.isFinite(v) && v >= 0) onSet(v);
    else setTxt(String(value));
  };
  return (
    <View style={styles.field}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldDef}>
          origine : {def}
          {unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <TextInput
        value={txt}
        onChangeText={setTxt}
        onEndEditing={commit}
        onSubmitEditing={commit}
        onBlur={commit}
        keyboardType="decimal-pad"
        style={[styles.num, changed && styles.numChanged]}
      />
      {changed ? (
        <Pressable onPress={() => onSet(null)} style={styles.undo} accessibilityLabel="Rétablir">
          <Text style={styles.undoText}>↺</Text>
        </Pressable>
      ) : (
        <View style={styles.undo} />
      )}
    </View>
  );
}

function Export({
  over,
  save,
  flash,
}: {
  over: Record<string, number>;
  save: (o: Record<string, number>) => void;
  flash: (m: string) => void;
}) {
  const json = JSON.stringify({ reglages: over, decor: getDecorEdits() });
  const [imp, setImp] = useState('');
  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.note}>
        Copie ce texte (réglages + décor) pour le garder, le mettre sur un autre appareil, ou me
        l’envoyer pour qu’il devienne la version officielle du jeu.
      </Text>
      <TextInput value={json} multiline editable={false} selectTextOnFocus style={styles.code} />
      <Text style={styles.h}>Importer</Text>
      <TextInput
        value={imp}
        onChangeText={setImp}
        multiline
        placeholder='{"reglages": {"eco.startCoins": 100}}'
        placeholderTextColor="#998"
        style={styles.code}
      />
      <Btn
        label="Appliquer"
        onPress={() => {
          try {
            const raw = JSON.parse(imp);
            const o = raw.reglages ?? (raw.decor ? {} : raw);
            const clean: Record<string, number> = {};
            for (const [k, v] of Object.entries(o))
              if (k in DEFAULTS && typeof v === 'number') clean[k] = v;
            save(clean);
            if (raw.decor && typeof raw.decor === 'object') {
              setDecorEdits(raw.decor as DecorEdits);
              useGame.getState().decorChanged();
            }
            flash(`${Object.keys(clean).length} réglages importés${raw.decor ? ' + décor' : ''}`);
          } catch {
            flash('Texte invalide');
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    marginTop: 40,
    backgroundColor: '#22201E',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 4,
    borderColor: '#E07B2E',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A2E26',
    paddingVertical: space.sm,
    borderTopLeftRadius: radius.lg - 4,
    borderTopRightRadius: radius.lg - 4,
  },
  bannerText: { color: '#FFE2C2', fontWeight: '900', fontSize: 18 },
  close: {
    position: 'absolute',
    right: space.sm,
    backgroundColor: '#C0392B',
    borderRadius: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  lock: { padding: space.lg, gap: space.md },
  label: { color: '#EEE', fontWeight: '800' },
  input: {
    backgroundColor: '#FFF8EC',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#222',
    marginBottom: space.sm,
  },
  tabs: { flexDirection: 'row', gap: 6, padding: space.sm },
  tab: {
    flex: 1,
    backgroundColor: '#3A342F',
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: '#E07B2E' },
  tabText: { color: '#fff', fontWeight: '900' },
  body: { padding: space.md, paddingBottom: 80, gap: 6 },
  h: { color: '#FFD86B', fontWeight: '900', fontSize: 15, marginTop: space.md, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 6 },
  btn: {
    flexGrow: 1,
    backgroundColor: '#5FAE3A',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '900' },
  note: { color: '#BBB', fontSize: 12 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#3A342F',
  },
  fieldLabel: { color: '#EEE', fontSize: 13, fontWeight: '700' },
  fieldDef: { color: '#888', fontSize: 11 },
  num: {
    width: 96,
    backgroundColor: '#FFF8EC',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    textAlign: 'right',
    color: '#222',
    fontWeight: '800',
  },
  numChanged: { backgroundColor: '#FFD9A8' },
  undo: { width: 28, alignItems: 'center' },
  undoText: { color: '#E07B2E', fontSize: 20, fontWeight: '900' },
  code: {
    backgroundColor: '#14120F',
    color: '#9FE39F',
    fontFamily: 'monospace',
    fontSize: 12,
    minHeight: 90,
    borderRadius: 6,
    padding: 8,
    textAlignVertical: 'top',
  },
  toast: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: { color: '#fff', fontWeight: '800' },
});
