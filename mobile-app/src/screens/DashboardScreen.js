import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import ScreenLayout from '../components/layout/ScreenLayout';
import {
  Badge,
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  MetricCard,
  Separator,
  Text,
} from '../components/ui';
import menuItems from '../config/menu.json';
import { useAuth } from '../contexts/AuthContext';
import { getBuildUpMasterAwbSummary } from '../services/buildUpService';
import { getThemeColors, theme } from '../styles/theme';

const dashboardMenuItems = menuItems.filter((item) => item.showInDashboard);
const drawerMenuItems = menuItems.filter((item) => item.showInDrawer);

const recentItems = [
  { title: 'Build up plan', description: '3 flight aktif', colorSet: 'primary' },
  { title: 'ULD control', description: '12 ULD siap', colorSet: 'accent' },
  { title: 'Cargo report', description: 'Update hari ini', colors: ['#16A34A', '#84CC16'] },
];

const gradientStyles = {
  hero: {
    marginTop: 32,
    minHeight: 192,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: theme.radius.sm,
    padding: 24,
  },
  recentCard: {
    marginRight: 12,
    height: 144,
    width: 224,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: theme.radius.sm,
    padding: 20,
  },
};

/**
 * Renders one service shortcut on the dashboard.
 * @param {{ item: object, onPress: Function }} props - Service item props.
 * @returns {React.ReactElement} Service card.
 */
function ServiceCard({ item, onPress }) {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme);

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 h-32 w-36 justify-between rounded-sm border border-border bg-card p-4"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-sm bg-muted"
        style={{ backgroundColor: colors.mutedBackground }}
      >
        <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
      </View>
      <View>
        <Text className="text-base font-bold text-foreground">{item.title}</Text>
        <Text className="mt-1 text-xs text-muted-foreground">{item.description}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Renders a full-width search affordance.
 * @param {{ className?: string }} props - Search field props.
 * @returns {React.ReactElement} Search field.
 */
function SearchField({ className = '' }) {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme);

  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-12 w-full flex-row items-center rounded-sm border border-border bg-card px-4 ${className}`}
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <MaterialCommunityIcons name="magnify" size={24} color={colors.muted} />
      <Text className="ml-3 flex-1 text-base text-muted-foreground" numberOfLines={1}>
        Search here
      </Text>
    </Pressable>
  );
}

/**
 * Renders the dashboard drawer menu with readable contrast.
 * @param {{ visible: boolean, onClose: Function, onLogout: Function, onNavigate: Function }} props - Drawer props.
 * @returns {React.ReactElement} Dashboard drawer.
 */
function DashboardDrawer({ visible, onClose, onLogout, onNavigate }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const isDarkMode = colorScheme === 'dark';

  /**
   * Toggles the app color scheme between light and dark mode.
   * @returns {void}
   */
  function handleThemeToggle() {
    setColorScheme(isDarkMode ? 'light' : 'dark');
  }

  /**
   * Handles drawer menu navigation while keeping inactive items harmless.
   * @param {object} item - Drawer menu item.
   * @returns {void}
   */
  function handleMenuPress(item) {
    if (item.href) {
      onNavigate(item.href);
    }
  }

  return (
    <Drawer visible={visible} onClose={onClose}>
      <DrawerPanel className="bg-background">
        <DrawerHeader className="pb-5">
          <Text className="text-3xl font-black text-foreground">
            MAU<Text className="text-primary">.</Text>
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">Menu operasional mobile</Text>
          <SearchField className="mt-3" />
        </DrawerHeader>

        <DrawerContent>
          {drawerMenuItems.map((item) => (
            <Pressable
              key={item.title}
              className="w-full min-h-14 flex-row items-center rounded-sm border border-border bg-card px-3"
              onPress={() => handleMenuPress(item)}
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-sm bg-muted"
                style={{ backgroundColor: colors.mutedBackground }}
              >
                <MaterialCommunityIcons name={item.icon} size={23} color={colors.primary} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
            </Pressable>
          ))}

          <Pressable
            className="w-full min-h-14 flex-row items-center rounded-sm border border-destructive bg-card px-3"
            onPress={onLogout}
            style={{ backgroundColor: colors.card, borderColor: colors.danger }}
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-sm bg-muted"
              style={{ backgroundColor: colors.mutedBackground }}
            >
              <MaterialCommunityIcons name="arrow-left" size={23} color={colors.danger} />
            </View>
            <Text className="ml-3 flex-1 text-base font-bold text-red-600" numberOfLines={1}>
              Sign out
            </Text>
          </Pressable>
        </DrawerContent>

        <DrawerFooter>
          <Separator />
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">Version 2.0.0</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-11 w-11 items-center justify-center rounded-sm border border-border bg-card"
              onPress={handleThemeToggle}
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <MaterialCommunityIcons
                name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
                size={24}
                color={isDarkMode ? colors.primary : '#F59E0B'}
              />
            </Pressable>
          </View>
        </DrawerFooter>
      </DrawerPanel>
    </Drawer>
  );
}

/**
 * Renders the authenticated dashboard screen.
 * @param {{ onOpenBuildUpChecklist?: Function, onOpenDraftBuildUp?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Dashboard screen.
 */
export default function DashboardScreen({ onOpenBuildUpChecklist, onOpenDraftBuildUp }) {
  const { user, logout } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [masterAwbSummary, setMasterAwbSummary] = useState({
    unfinished: 0,
    completed: 0,
  });
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  /**
   * Loads all-time Master AWB Build Up summary for dashboard counters.
   * @returns {Promise<void>} Resolves after summary is loaded.
   */
  async function loadMasterAwbSummary() {
    setIsSummaryLoading(true);
    setSummaryError('');

    try {
      const summary = await getBuildUpMasterAwbSummary();
      setMasterAwbSummary(summary);
    } catch (error) {
      console.error('[dashboard] Load Master AWB summary gagal', error);
      setSummaryError(error?.message || 'Gagal memuat ringkasan Master AWB.');
    } finally {
      setIsSummaryLoading(false);
    }
  }

  useEffect(() => {
    loadMasterAwbSummary();
  }, []);

  /**
   * Handles tapping a service card.
   * @param {object} item - Service item configuration.
   * @returns {void}
   */
  function handleServicePress(item) {
    if (item.href === '/build-up-checklist' && onOpenBuildUpChecklist) {
      onOpenBuildUpChecklist();
      return;
    }

    if (item.href === '/draft-build-up' && onOpenDraftBuildUp) {
      onOpenDraftBuildUp();
    }
  }

  /**
   * Handles drawer route navigation.
   * @param {string} href - Expo Router path.
   * @returns {void}
   */
  function handleDrawerNavigate(href) {
    setIsMenuOpen(false);

    if (href === '/build-up-checklist' && onOpenBuildUpChecklist) {
      onOpenBuildUpChecklist();
      return;
    }

    if (href === '/draft-build-up' && onOpenDraftBuildUp) {
      onOpenDraftBuildUp();
    }
  }

  /**
   * Resolves dashboard recent card gradients for the active color mode.
   * @param {object} item - Recent item configuration.
   * @returns {string[]} Gradient colors.
   */
  function getRecentCardColors(item) {
    if (item.colorSet === 'primary') {
      return [colors.primary, '#06B6D4'];
    }

    if (item.colorSet === 'accent') {
      return [colors.foreground, '#F97316'];
    }

    return item.colors;
  }

  return (
    <ScreenLayout>
      <DashboardDrawer
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={logout}
        onNavigate={handleDrawerNavigate}
      />

      <View className="mb-7 flex-row items-center justify-between">
        <Pressable
          onPress={() => setIsMenuOpen(true)}
          className="h-12 w-12 items-center justify-center rounded-sm bg-primary"
          style={{ backgroundColor: colors.primary }}
        >
          <MaterialCommunityIcons name="menu" size={27} color="#FFFFFF" />
        </Pressable>
        <Text className="text-3xl font-black text-foreground">
          MAU<Text className="text-primary">.</Text>
        </Text>
        <View
          className="relative h-12 w-12 items-center justify-center rounded-sm border border-border bg-card"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <MaterialCommunityIcons name="bell-outline" size={26} color={colors.foreground} />
          <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
        </View>
      </View>

      <View className="mb-6 w-full">
        <Badge variant="secondary">
          <Text>Dashboard</Text>
        </Badge>
        <Text className="mt-2 text-2xl font-extrabold text-foreground">
          Halo, {user?.username || user?.email || 'Operator'}
        </Text>
        <Text className="mt-1 text-sm leading-5 text-muted-foreground">
          Pantau aktivitas gudang dan lanjutkan proses operasional hari ini.
        </Text>
      </View>

      <SearchField />
      <View className="mt-6 flex-row gap-3">
        <MetricCard
          title="Master Belum Selesai"
          value={masterAwbSummary.unfinished}
          caption="MAWB perlu rincian"
          variant="blue"
          loading={isSummaryLoading}
        />
        <MetricCard
          title="Master Selesai"
          value={masterAwbSummary.completed}
          caption="MAWB selesai total"
          variant="violet"
          loading={isSummaryLoading}
        />
      </View>

      {summaryError ? (
        <View className="mt-3 rounded-sm border border-destructive bg-red-50 p-3">
          <Text variant="error">{summaryError}</Text>
        </View>
      ) : null}

      <View className="mt-8">
        <Text className="mb-4 text-xl font-extrabold text-foreground">Services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dashboardMenuItems.map((item) => (
            <ServiceCard key={item.title} item={item} onPress={() => handleServicePress(item)} />
          ))}
        </ScrollView>
      </View>

      <LinearGradient
        colors={[colors.primary, colors.foreground]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={gradientStyles.hero}
      >
        <View className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute -left-8 bottom-10 h-28 w-28 rounded-full bg-indigo-300/20" />
        <Text className="text-2xl font-black text-white">MAU operational workspace</Text>
        <Text className="mt-2 text-sm leading-5 text-indigo-100">
          Build up, weighing, dan reporting tetap lewat backend resmi.
        </Text>
      </LinearGradient>

      <View className="mt-8">
        <Text className="mb-4 text-xl font-extrabold text-foreground">Recently viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentItems.map((item) => (
            <LinearGradient
              key={item.title}
              colors={getRecentCardColors(item)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={gradientStyles.recentCard}
            >
              <View className="absolute right-5 top-5 h-16 w-16 rounded-full bg-white/20" />
              <Text className="text-lg font-extrabold text-white">{item.title}</Text>
              <Text className="mt-1 text-sm text-white/85">{item.description}</Text>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}
