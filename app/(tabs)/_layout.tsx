import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarButton: HapticTab, tabBarStyle: { paddingTop: 7, paddingBottom: bottomPadding, height: 56 + bottomPadding, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 0.5 } }}>
      <Tabs.Screen name="index" options={{ title: "Hoje", tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={23} color={color} /> }} />
      <Tabs.Screen name="pets" options={{ title: "Pets", tabBarIcon: ({ color }) => <IconSymbol name="pawprint.fill" size={23} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: "Histórico", tabBarIcon: ({ color }) => <IconSymbol name="clock.arrow.circlepath" size={23} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: "Mais", tabBarIcon: ({ color }) => <IconSymbol name="ellipsis" size={23} color={color} /> }} />
    </Tabs>
  );
}
