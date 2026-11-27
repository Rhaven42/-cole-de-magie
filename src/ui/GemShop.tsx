import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SPRITES, type SpriteName } from '../assets';
import { GEM_ITEMS } from '../data/gemShop';
import { boostActive, gemItemCost, gemLevel, treasureCoins } from '../engine';
import { useGame, useTick } from '../state/store';
import { formatDuration, formatNumber, radius, space } from './theme';

/** Boutique de Diamants : améliorations permanentes et objets magiques. */
export function GemShop() {
  useTick();
  const open = useGame((s) => s.panel === 'gems');
  const game = useGame((s) => s.game);
  const store = useGame.getState();
  if (!open) return null;
  const close = () => store.openPanel(null);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>💎 Boutique de Diamants</Text>
          <Pressable onPress={close} style={styles.close} accessibilityLabel="Fermer">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.wallet}>
          <Image source={SPRITES.diamond.src} style={{ width: 28, height: 34 }} />
          <Text style={styles.walletText}>{game.gems} Diamants</Text>
        </View>
        <Text style={styles.hint}>
          Gagne des Diamants avec l’Arbre enchanté (pub), les bonus, le cadeau du jour et la Coupe
          des Maisons.
        </Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {GEM_ITEMS.map((it) => {
            const lvl = gemLevel(game, it.id);
            const cost = gemItemCost(game, it.id);
            const can = cost !== null && game.gems >= cost;
            let extra = '';
            if (it.id === 'treasure') extra = `+${formatNumber(treasureCoins(game))} 💰`;
            if (it.id === 'fortune' && boostActive(game))
              extra = `Actif : ${formatDuration((game.boostUntil ?? 0) - game.time)}`;
            return (
              <View key={it.id} style={styles.card}>
                {it.max > 1 ? (
                  <View style={styles.lvl}>
                    <Text style={styles.lvlText}>
                      {lvl}/{it.max}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.art}>
                  <Image
                    source={SPRITES[it.sprite as SpriteName].src}
                    style={{ width: 64, height: 64 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.name}>{it.name}</Text>
                <Text style={styles.desc}>{it.desc}</Text>
                {extra ? <Text style={styles.extra}>{extra}</Text> : null}
                {cost === null ? (
                  <Text style={styles.owned}>★ Acquis</Text>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={can ? () => store.buyGemItem(it.id) : undefined}
                    style={[styles.btn, !can && styles.btnOff]}
                  >
                    <Text style={styles.btnText}>💎 {cost}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#2B2347',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 4,
    borderColor: '#7FD3FF',
    paddingBottom: space.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B3A8A',
    paddingVertical: space.sm,
    borderTopLeftRadius: radius.lg - 4,
    borderTopRightRadius: radius.lg - 4,
  },
  bannerText: { color: '#E8F7FF', fontWeight: '900', fontSize: 18 },
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
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: space.sm,
  },
  walletText: { color: '#7FD3FF', fontWeight: '900', fontSize: 20 },
  hint: { color: '#B9B0D9', fontSize: 12, textAlign: 'center', marginHorizontal: space.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: space.sm,
    gap: space.sm,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#3E3466',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#7FD3FF',
    padding: space.sm,
    alignItems: 'center',
  },
  lvl: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#1B1530',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lvlText: { color: '#7FD3FF', fontWeight: '900', fontSize: 12 },
  art: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(127,211,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: '#FFF3D6', fontWeight: '900', fontSize: 14, marginTop: 4, textAlign: 'center' },
  desc: { color: '#D3CBEF', fontSize: 11, textAlign: 'center', marginVertical: 4 },
  extra: { color: '#FFD86B', fontWeight: '800', fontSize: 12 },
  owned: { color: '#FFD86B', fontWeight: '900', paddingVertical: 6 },
  btn: {
    marginTop: 4,
    alignSelf: 'stretch',
    backgroundColor: '#3A9FD9',
    borderRadius: radius.sm,
    borderBottomWidth: 3,
    borderColor: '#24699C',
    alignItems: 'center',
    paddingVertical: 5,
  },
  btnOff: { backgroundColor: '#6A6680', borderColor: '#4E4A63' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
