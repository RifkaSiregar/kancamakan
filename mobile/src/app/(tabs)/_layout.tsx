import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '../../components/TabBar';
import { C } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tabBar={(props: any) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}
    >
      <Tabs.Screen name="home" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="challenges" options={{ title: 'Tantangan' }} />
      <Tabs.Screen name="foods" options={{ title: 'Makanan' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
