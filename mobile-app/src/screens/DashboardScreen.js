import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenLayout from '../components/layout/ScreenLayout';
import { Badge, Card, CardContent, Separator, Text as UiText } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const serviceItems = [
  {
    title: 'Build Up',
    description: 'Checklist awal',
    icon: 'clipboard-check-outline',
    href: '/build-up-checklist',
    legacyRoute: 'BuildUpChecklist',
  },
  { title: 'Weighing', description: 'Timbang kargo', icon: 'weight-kilogram' },
  { title: 'EDI', description: 'Status pesan', icon: 'send-outline' },
  { title: 'Warehouse', description: 'Area kerja', icon: 'warehouse' },
];

const recentItems = [
  { title: 'Build up plan', description: '3 flight aktif', colors: ['#2563EB', '#06B6D4'] },
  { title: 'ULD control', description: '12 ULD siap', colors: ['#0F172A', '#F97316'] },
  { title: 'Cargo report', description: 'Update hari ini', colors: ['#16A34A', '#84CC16'] },
];

const menuItems = [
  { title: 'Profile', icon: 'account-outline' },
  { title: 'Onboarding', icon: 'lightbulb-outline' },
  { title: 'Welcome', icon: 'cube-outline' },
  { title: 'Permissions', icon: 'shield-check-outline' },
  { title: 'Chat', icon: 'chat-outline' },
];

const gradientStyles = {
  hero: {
    marginTop: 32,
    minHeight: 192,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 24,
    padding: 24,
  },
  recentCard: {
    marginRight: 12,
    height: 144,
    width: 224,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 16,
    padding: 20,
  },
};

/**
 * Renders one service shortcut on the dashboard.
 * @param {{ item: object, onPress: Function }} props - Service item props.
 * @returns {React.ReactElement} Service card.
 */
function ServiceCard({ item, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-3 h-32 w-36 justify-between rounded-2xl border border-slate-200 bg-white p-4"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
        <MaterialCommunityIcons name={item.icon} size={24} color="#2563EB" />
      </View>
      <View>
        <Text className="text-base font-bold text-slate-950">{item.title}</Text>
        <Text className="mt-1 text-xs text-slate-500">{item.description}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Renders the left menu panel inspired by the provided mobile mockup.
 * @param {{ visible: boolean, onClose: Function, onLogout: Function }} props - Drawer props.
 * @returns {React.ReactElement} Drawer modal.
 */
function SideMenu({ visible, onClose, onLogout }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 flex-row bg-slate-950/50">
        <SafeAreaView className="w-[84%] bg-white px-6 py-5 web:max-w-[360px]">
          <Text className="mt-6 text-3xl font-black text-slate-950">
            MAU<Text className="text-blue-600">.</Text>
          </Text>

          <View className="mt-8 min-h-12 flex-row items-center rounded-2xl bg-slate-100 px-4">
            <MaterialCommunityIcons name="magnify" size={23} color="#475569" />
            <Text className="ml-3 text-base text-slate-500">Search here</Text>
          </View>

          <View className="mt-10 gap-5">
            {menuItems.map((item) => (
              <Pressable key={item.title} className="flex-row items-center">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <MaterialCommunityIcons name={item.icon} size={24} color="#0F172A" />
                </View>
                <Text className="ml-4 text-lg font-bold text-slate-900">{item.title}</Text>
              </Pressable>
            ))}

            <Pressable className="flex-row items-center" onPress={onLogout}>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                <MaterialCommunityIcons name="arrow-left" size={24} color="#DC2626" />
              </View>
              <Text className="ml-4 text-lg font-bold text-red-600">Sign out</Text>
            </Pressable>
          </View>

          <Separator className="mt-10" />
          <View className="mt-6 flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">Version 2.0.0</Text>
            <MaterialCommunityIcons name="white-balance-sunny" size={26} color="#F59E0B" />
          </View>
        </SafeAreaView>

        <Pressable className="flex-1" onPress={onClose} />
      </View>
    </Modal>
  );
}

/**
 * Renders the authenticated dashboard screen.
 * @param {{ navigation?: object, onOpenBuildUpChecklist?: Function }} props - Navigation callbacks.
 * @returns {React.ReactElement} Dashboard screen.
 */
export default function DashboardScreen({ navigation, onOpenBuildUpChecklist }) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    if (item.legacyRoute && navigation?.navigate) {
      navigation.navigate(item.legacyRoute);
    }
  }

  return (
    <ScreenLayout
      footer={
        <View className="min-h-20 flex-row items-center justify-around border-t border-slate-200 bg-white px-4 pb-3 pt-2 web:self-center web:w-full web:max-w-[520px]">
          <View className="items-center">
            <MaterialCommunityIcons name="home-outline" size={28} color="#2563EB" />
            <Text className="text-xs font-semibold text-blue-600">Home</Text>
          </View>
          <MaterialCommunityIcons name="cube-outline" size={27} color="#94A3B8" />
          <MaterialCommunityIcons name="magnify" size={28} color="#94A3B8" />
          <MaterialCommunityIcons name="bookmark-outline" size={27} color="#94A3B8" />
          <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-900">
            <Text className="text-sm font-bold text-white">
              {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      }
    >
      <SideMenu visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} onLogout={logout} />

            <View className="mb-6 flex-row items-center justify-between">
              <Pressable
                onPress={() => setIsMenuOpen(true)}
                className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
              >
                <MaterialCommunityIcons name="menu" size={27} color="#0F172A" />
              </Pressable>
              <Text className="text-3xl font-black text-slate-950">
                MAU<Text className="text-blue-600">.</Text>
              </Text>
              <View className="relative h-12 w-12 items-center justify-center rounded-2xl bg-white">
                <MaterialCommunityIcons name="bell-outline" size={26} color="#0F172A" />
                <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
              </View>
            </View>

            <View className="mb-6">
              <Badge variant="secondary">
                <UiText>Dashboard</UiText>
              </Badge>
              <Text className="mt-1 text-2xl font-extrabold text-slate-950">
                Halo, {user?.username || user?.email || 'Operator'}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-500">
                Pantau aktivitas gudang dan lanjutkan proses operasional hari ini.
              </Text>
            </View>

            <View className="min-h-12 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
              <MaterialCommunityIcons name="magnify" size={24} color="#64748B" />
              <Text className="ml-3 text-base text-slate-500">Search here</Text>
            </View>

            <View className="mt-6 flex-row gap-3">
              <Card className="flex-1 border-transparent bg-blue-600">
                <CardContent className="p-4">
                  <Text className="text-xs font-semibold uppercase text-blue-100">Open task</Text>
                  <Text className="mt-2 text-3xl font-black text-white">18</Text>
                  <Text className="mt-1 text-xs text-blue-100">Perlu diproses</Text>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="p-4">
                  <Text className="text-xs font-semibold uppercase text-slate-500">On time</Text>
                  <Text className="mt-2 text-3xl font-black text-slate-950">96%</Text>
                  <Text className="mt-1 text-xs text-slate-500">Shift hari ini</Text>
                </CardContent>
              </Card>
            </View>

            <View className="mt-8">
              <Text className="mb-4 text-xl font-extrabold text-slate-950">Popular services</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {serviceItems.map((item) => (
                  <ServiceCard key={item.title} item={item} onPress={() => handleServicePress(item)} />
                ))}
              </ScrollView>
            </View>

            <LinearGradient
              colors={['#2563EB', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={gradientStyles.hero}
            >
              <View className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" />
              <View className="absolute -left-8 bottom-10 h-28 w-28 rounded-full bg-cyan-300/20" />
              <Text className="text-2xl font-black text-white">MAU operational workspace</Text>
              <Text className="mt-2 text-sm leading-5 text-blue-100">
                Build up, weighing, dan reporting tetap lewat backend resmi.
              </Text>
            </LinearGradient>

            <View className="mt-8">
              <Text className="mb-4 text-xl font-extrabold text-slate-950">Recently viewed</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentItems.map((item) => (
                  <LinearGradient
                    key={item.title}
                    colors={item.colors}
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
