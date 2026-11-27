import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SPRITES } from '../assets';
import { ECONOMY } from '../data/economy';
import { seatTier, seatUpgradeBulk, type GameState, type Station } from '../engine';
import { useGame } from '../state/store';
import { seatSprite } from '../ui/isoArt';
import { formatNumber, radius, space } from '../ui/theme';

const TIER_LABEL = ['Ordinaire', 'Amélioré', 'Légendaire'];
const TIER_COLOR = ['#B98A5A', '#4F8FD9', '#E0A526'];
type Mult = 1 | 10 | 'max';

/** Prochain palier (nouveau look au 20, au 40, puis le max). */
function nextMilestone(level: number): number {
  const { improved, legendary } = ECONOMY.seatTiers;
  if (level < improved) return improved;
  if (level < legendary) return legendary;
  return ECONOMY.seatUpgrade.maxLevel;
}

/** Objets de la salle (une carte par place), façon idle : image, niveau, palier, bouton. */
export function SeatCards({ st, game, name }: { st: Station; game: GameState; name: string }) {
  const [mult, setMult] = useState<Mult>(1);
  const store = useGame.getState();
  const kind = st.kind === 'course' ? st.courseId! : st.kind;
  const max = ECONOMY.seatUpgrade.maxLevel;
  const isCourse = st.kind === 'course';
  const per = `−${(ECONOMY.seatUpgrade.timePerLevel * 100).toFixed(1).replace('.', ',')} % de durée${
    isCourse ? ` · +${Math.round(ECONOMY.seatUpgrade.coinPerLevel * 100)} % d’Éclats` : ''
  } par niveau`;
  return (
    <View>
      <View style={styles.multRow}>
        <Text style={styles.per}>{per}</Text>
        {([1, 10, 'max'] as Mult[]).map((m) => (
          <Pressable
            key={String(m)}
            onPress={() => setMult(m)}
            style={[styles.mult, mult === m && styles.multOn]}
          >
            <Text style={[styles.multText, mult === m && { color: '#fff' }]}>
              {m === 'max' ? 'Max' : `×${m}`}
            </Text>
          </Pressable>
        ))}
      </View>
      {st.seats.map((seat, i) => {
        const tier = seatTier(seat.level);
        const sprite = seatSprite(kind, tier);
        const src = sprite ? SPRITES[sprite]?.src : undefined;
        const goal = nextMilestone(seat.level);
        const prev =
          seat.level >= ECONOMY.seatTiers.legendary
            ? ECONOMY.seatTiers.legendary
            : seat.level >= ECONOMY.seatTiers.improved
              ? ECONOMY.seatTiers.improved
              : 1;
        const pct = seat.level >= max ? 1 : (seat.level - prev) / Math.max(1, goal - prev);
        const want = mult === 'max' ? max : mult;
        const bulk =
          mult === 'max'
            ? (seatUpgradeBulk(st, i, want, game.coins) ?? seatUpgradeBulk(st, i, 1))
            : seatUpgradeBulk(st, i, want);
        const can = !!bulk && game.coins >= bulk.cost;
        return (
          <View key={i} style={styles.card}>
            <View style={[styles.art, { borderColor: TIER_COLOR[tier] }]}>
              {src ? <Image source={src} style={styles.img} resizeMode="contain" /> : null}
              <View style={[styles.tierTag, { backgroundColor: TIER_COLOR[tier] }]}>
                <Text style={styles.tierText}>{TIER_LABEL[tier]}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {name} n°{i + 1}
              </Text>
              <Text style={styles.lvl}>
                Niv. <Text style={styles.lvlNum}>{seat.level}</Text> / {max}
              </Text>
              <View style={styles.bar}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.min(100, pct * 100)}%`, backgroundColor: TIER_COLOR[tier] },
                  ]}
                />
              </View>
              <Text style={styles.goal}>
                {seat.level >= max
                  ? '★ Niveau maximum'
                  : goal === max
                    ? `Niveau max : ${max}`
                    : `✨ Nouveau look au niv. ${goal}`}
              </Text>
            </View>
            {bulk ? (
              <Pressable
                accessibilityRole="button"
                onPress={can ? () => store.upgradeSeat(st.id, i, bulk.levels) : undefined}
                style={({ pressed }) => [
                  styles.btn,
                  !can && styles.btnOff,
                  pressed && can && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={styles.btnLabel}>
                  {bulk.levels > 1 ? `+${bulk.levels} niv.` : 'Améliorer'}
                </Text>
                <Text style={styles.btnCost}>💰 {formatNumber(bulk.cost)}</Text>
              </Pressable>
            ) : (
              <View style={[styles.btn, styles.btnMax]}>
                <Text style={styles.btnLabel}>Max</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const PAPER = '#F3E3BF';
const BORDER = '#D8BE8A';
const styles = StyleSheet.create({
  multRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  per: { flex: 1, fontSize: 11, color: '#7A6446' },
  mult: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8A5A2B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: PAPER,
  },
  multOn: { backgroundColor: '#8A5A2B' },
  multText: { fontWeight: '900', color: '#8A5A2B', fontSize: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: PAPER,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: BORDER,
    padding: space.sm,
    marginBottom: space.sm,
  },
  art: {
    width: 66,
    height: 66,
    borderRadius: radius.sm,
    borderWidth: 3,
    backgroundColor: '#E6CFA0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: 54, height: 50, marginBottom: 8 },
  tierTag: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 1 },
  tierText: { color: '#fff', fontSize: 8, fontWeight: '900', textAlign: 'center' },
  name: { fontWeight: '900', fontSize: 15, color: '#4A2E16' },
  lvl: { color: '#6B4A2A', fontWeight: '700', fontSize: 12 },
  lvlNum: { color: '#C77A10', fontWeight: '900', fontSize: 14 },
  bar: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E6CFA0',
    overflow: 'hidden',
    marginVertical: 3,
  },
  barFill: { height: '100%' },
  goal: { fontSize: 10, color: '#7A6446', fontWeight: '700' },
  btn: {
    minWidth: 92,
    backgroundColor: '#5FAE3A',
    borderRadius: radius.sm,
    borderBottomWidth: 3,
    borderColor: '#3D7A22',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  btnOff: { backgroundColor: '#9A9EA2', borderColor: '#73777B' },
  btnMax: { backgroundColor: '#C9A25A', borderColor: '#8A6A2A' },
  btnLabel: { color: '#fff', fontWeight: '900', fontSize: 14 },
  btnCost: { color: '#FFF3C4', fontWeight: '800', fontSize: 12 },
});
