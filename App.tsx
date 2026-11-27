import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HousesScreen } from './src/screens/HousesScreen';
import { RoomSheet } from './src/screens/RoomSheet';
import { SchoolScreen } from './src/screens/SchoolScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { StudentSheet } from './src/screens/StudentSheet';
import { DailyModal } from './src/ui/DailyModal';
import { ShopScreen } from './src/screens/ShopScreen';
import { StudentsScreen } from './src/screens/StudentsScreen';
import { useGame } from './src/state/store';
import { useGameLoop } from './src/state/useGameLoop';
import { Hud } from './src/ui/Hud';
import { OfflineModal } from './src/ui/OfflineModal';
import { GemShop } from './src/ui/GemShop';
import { TreePanel } from './src/ui/TreePanel';
import { AdminPanel } from './src/screens/AdminPanel';
import { TabBar, type Tab } from './src/ui/TabBar';
import { Toasts } from './src/ui/Toasts';
import { colors } from './src/ui/theme';

function Game() {
  useGameLoop();
  const ready = useGame((s) => s.ready);
  const [tab, setTab] = useState<Tab>('school');
  const editing = useGame((s) => s.editor.on);
  // L'éditeur de décor s'ouvre sur la carte.
  const shown: Tab = editing ? 'school' : tab;
  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.candle} size="large" />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <Hud />
      <View style={{ flex: 1 }}>
        {shown === 'school' && <SchoolScreen />}
        {shown === 'shop' && <ShopScreen />}
        {shown === 'students' && <StudentsScreen />}
        {shown === 'houses' && <HousesScreen />}
        {shown === 'more' && <MoreScreen />}
      </View>
      {editing ? null : <TabBar tab={shown} onChange={setTab} />}
      <Toasts />
      <RoomSheet />
      <StudentSheet />
      <DailyModal />
      <OfflineModal />
      <TreePanel />
      <GemShop />
      <AdminPanel />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <StatusBar style="light" />
          <Game />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.woodDark },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.night,
  },
});
