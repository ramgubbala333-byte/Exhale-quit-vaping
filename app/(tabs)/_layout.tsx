import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, IoniconName> = {
  index: 'home-outline',
  milestones: 'flag-outline',
  stats: 'stats-chart-outline',
  journal: 'book-outline',
  settings: 'settings-outline',
};

/**
 * PulseBuddy bottom nav: a FLOATING WHITE PILL bar with outline
 * icons; the active item sits in a solid dark circle. The bar floats
 * above the Android system navigation with the bottom inset baked
 * into its offset, so it never collides with the system bar.
 *
 * Wiring: expo-router's Tabs invokes this with the fork's real
 * BottomTabBarProps ({ state, descriptors, emitter, navigateToTab,
 * insets }) — there is no `navigation` object. Presses mirror the
 * fork's own BottomTabBar: emit `tabPress` through the emitter and,
 * unless a listener prevented default, call navigateToTab(route.key).
 */
function PillTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const icon: IoniconName = ICONS[route.name] ?? 'ellipse-outline';
          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };
          const onLongPress = () => {
            emitter.emit({ type: 'tabLongPress', target: route.key });
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={
                options.tabBarAccessibilityLabel ?? options.title ?? route.name
              }
              style={styles.item}>
              <View
                style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={icon}
                  size={22}
                  color={focused ? colors.white : colors.inkMuted}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={PillTabBar} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="milestones" options={{ title: 'Milestones' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#2A2A2D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  item: { paddingHorizontal: 6 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.charcoal },
});
