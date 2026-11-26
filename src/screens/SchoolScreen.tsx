import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { HOUSE_IDS } from '../data/houses';
import type { GameState, Station } from '../engine';
import { t } from '../i18n';
import { Crest } from '../ui/Crest';
import { RoomCard } from '../ui/RoomCard';
import { colors, space } from '../ui/theme';
import { useGame, useTick } from '../state/store';

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function Floor({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.floor}>
      <View style={styles.floorRow}>{children}</View>
      <View style={styles.beam}>
        <Text style={styles.beamText}>{label}</Text>
      </View>
    </View>
  );
}

/** Vue en coupe du manoir : dortoirs en haut, salles de cours, puis rez-de-chaussée. */
export function SchoolScreen() {
  useTick();
  const game: GameState = useGame((s) => s.game);
  const scroll = useRef<ScrollViewInstance>(null);
  const didScroll = useRef(false);
  const all = game.stationOrder.map((id) => game.stations[id]);
  const dorms = all.filter((s) => s.kind === 'dorm');
  const courses = all.filter((s) => s.kind === 'course');
  const st = game.stations;

  const courseFloors = chunk<Station>(courses, 2).reverse();
  const dormFloors = chunk<Station>(dorms, 2).reverse();

  return (
    <ScrollView
      ref={scroll}
      style={styles.sky}
      contentContainerStyle={{ paddingBottom: space.md }}
      onContentSizeChange={() => {
        // Au premier affichage on montre le rez-de-chaussée (Accueil).
        if (!didScroll.current) {
          scroll.current?.scrollToEnd({ animated: false });
          didScroll.current = true;
        }
      }}
    >
      <View style={styles.roof}>
        <View style={styles.bannerRow}>
          {HOUSE_IDS.map((h) => (
            <View key={h} style={styles.banner}>
              <Crest house={h} size={30} />
            </View>
          ))}
        </View>
        <Text style={styles.roofTitle}>{t('app.title')}</Text>
      </View>
      {dormFloors.map((row, i) => (
        <Floor key={`d${i}`} label="🛏️">
          {row.map((s) => (
            <RoomCard key={s.id} game={game} station={s} />
          ))}
        </Floor>
      ))}
      {courseFloors.map((row, i) => (
        <Floor key={`c${i}`} label="📚">
          {row.map((s) => (
            <RoomCard key={s.id} game={game} station={s} />
          ))}
        </Floor>
      ))}
      <Floor label="🍽️">
        <RoomCard game={game} station={st.hall} wide />
      </Floor>
      <Floor label="🚪">
        <RoomCard game={game} station={st.reception} />
        <RoomCard game={game} station={st.sorting} />
      </Floor>
      <View style={styles.ground}>
        <Text style={styles.gate}>
          ⛩️ Grille d’entrée — {t('room.queue')} : {st.reception.queue.length}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sky: { flex: 1, backgroundColor: colors.night },
  roof: {
    marginTop: space.lg,
    marginHorizontal: space.lg,
    paddingVertical: space.md,
    alignItems: 'center',
    backgroundColor: '#6B2F2F',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    borderWidth: 3,
    borderColor: colors.woodDark,
  },
  roofTitle: { color: colors.candle, fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  bannerRow: { flexDirection: 'row', gap: space.md, marginBottom: 4, marginTop: space.md },
  banner: { padding: 2 },
  floor: { marginHorizontal: space.sm, backgroundColor: colors.woodDark, paddingTop: 3 },
  floorRow: { flexDirection: 'row' },
  beam: { height: 14, backgroundColor: colors.woodLight, justifyContent: 'center', paddingLeft: 6 },
  beamText: { fontSize: 9 },
  ground: {
    marginHorizontal: space.sm,
    backgroundColor: '#3F5A2A',
    padding: space.md,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  gate: { color: colors.parchment, fontWeight: '700', textAlign: 'center' },
});
