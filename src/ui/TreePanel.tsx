import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SPRITES } from '../assets';
import { TREE } from '../data/gemShop';
import { treeCoins, treeEvery, treeWait } from '../engine';
import { useGame, useTick } from '../state/store';
import { AdVideo } from './AdVideo';
import { formatDuration, formatNumber, radius, space } from './theme';

/** Fenêtre de l'Arbre enchanté : cueillir le fruit, ou regarder une pub pour un Diamant en plus. */
export function TreePanel() {
  useTick();
  const open = useGame((s) => s.panel === 'tree');
  const game = useGame((s) => s.game);
  const clock = useGame((s) => s.clock);
  const store = useGame.getState();
  const [video, setVideo] = useState(false);
  if (!open) return null;
  const close = () => {
    setVideo(false);
    store.openPanel(null);
  };
  const wait = treeWait(game, clock);
  const coins = treeCoins(game);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={video ? undefined : close}>
        {video ? (
          <AdVideo
            onDone={(ok) => {
              if (ok) store.harvestTree(true);
              close();
            }}
          />
        ) : (
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Arbre enchanté</Text>
            </View>
            <Image
              source={(wait > 0 ? SPRITES.magicTreeBare : SPRITES.magicTree).src}
              style={styles.tree}
              resizeMode="contain"
            />
            {wait > 0 ? (
              <>
                <Text style={styles.title}>Le prochain fruit mûrit…</Text>
                <Text style={styles.timer}>⏳ {formatDuration(wait)}</Text>
                <Text style={styles.sub}>
                  Un fruit doré pousse toutes les {formatDuration(treeEvery(game))}.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Un fruit doré est mûr !</Text>
                <Pressable style={styles.btn} onPress={() => (store.harvestTree(false), close())}>
                  <Text style={styles.btnText}>Cueillir</Text>
                  <Text style={styles.btnSub}>+{formatNumber(coins)} 💰</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.ad]} onPress={() => setVideo(true)}>
                  <Text style={styles.btnText}>▶ Regarder une pub</Text>
                  <Text style={styles.btnSub}>
                    +{formatNumber(coins)} 💰 et +{TREE.adGems} 💎
                  </Text>
                </Pressable>
              </>
            )}
            <Pressable style={styles.no} onPress={close}>
              <Text style={styles.noText}>Fermer</Text>
            </Pressable>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 300,
    backgroundColor: '#F3E3BF',
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: '#5E3C8A',
    alignItems: 'center',
    paddingBottom: space.md,
    overflow: 'hidden',
  },
  banner: {
    alignSelf: 'stretch',
    backgroundColor: '#5E3C8A',
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  bannerText: { color: '#FFF3D6', fontWeight: '900', fontSize: 17 },
  tree: { width: 150, height: 180, marginTop: space.sm },
  title: { fontWeight: '900', fontSize: 17, color: '#4A2E16', textAlign: 'center' },
  timer: { fontWeight: '900', fontSize: 22, color: '#5E3C8A', marginTop: 4 },
  sub: {
    color: '#7A6446',
    marginVertical: space.sm,
    textAlign: 'center',
    marginHorizontal: space.md,
  },
  btn: {
    width: 240,
    backgroundColor: '#5FAE3A',
    borderRadius: radius.sm,
    borderBottomWidth: 3,
    borderColor: '#3D7A22',
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: space.sm,
  },
  ad: { backgroundColor: '#3A7FD9', borderColor: '#24569C' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  btnSub: { color: '#FFF3C4', fontWeight: '800', fontSize: 13 },
  no: { marginTop: space.sm, padding: space.sm },
  noText: { color: '#7A6446', fontWeight: '700' },
});
