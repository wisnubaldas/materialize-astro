import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import menuItems from '../../config/menu.json';
import { useThemeColors } from '../../styles/theme';
import { Text } from '../ui';

const footerMenuItems = menuItems.filter((item) => item.showInFooter);

const layoutStyles = {
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  body: {
    flex: 1,
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
};

/**
 * Renders the static bottom navigation shared by operational screens.
 * @returns {React.ReactElement} Footer navigation.
 */
function StaticFooterMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();

  /**
   * Navigates to a menu route when that menu is already implemented.
   * @param {string|null} href - Expo Router path.
   * @returns {void}
   */
  function handleNavigate(href) {
    if (!href || href === pathname) return;

    router.push(href);
  }

  return (
    <View
      className="border-t border-border bg-card px-2 pb-2 pt-2 web:self-center web:w-full web:max-w-[520px]"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="min-h-16 flex-row items-center justify-around">
        {footerMenuItems.map((item) => {
          const isActive = item.activePaths.includes(pathname);
          const iconColor = isActive ? colors.primary : colors.muted;
          const isDisabled = !item.href;

          return (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              disabled={isDisabled}
              onPress={() => handleNavigate(item.href)}
              className="h-14 min-w-14 items-center justify-center rounded-sm px-2"
              style={{
                backgroundColor: isActive ? colors.mutedBackground : 'transparent',
                opacity: isDisabled ? 0.55 : 1,
              }}
            >
              <MaterialCommunityIcons name={item.icon} size={24} color={iconColor} />
              <Text
                className={`mt-0.5 text-[11px] font-semibold ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                numberOfLines={1}
              >
                {item.label || item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Provides the default safe area, keyboard, and responsive content frame for mobile screens.
 * @param {{ children: React.ReactNode, header?: React.ReactNode, footer?: React.ReactNode, scroll?: boolean, keyboardAware?: boolean, contentClassName?: string, scrollContentClassName?: string, showStaticFooter?: boolean }} props - Layout configuration.
 * @returns {React.ReactElement} Shared screen frame.
 */
export default function ScreenLayout({
  children,
  header = null,
  footer = null,
  scroll = true,
  keyboardAware = false,
  contentClassName = '',
  scrollContentClassName = '',
  showStaticFooter = true,
}) {
  const colors = useThemeColors();
  const Wrapper = keyboardAware ? KeyboardAvoidingView : View;
  const wrapperProps = keyboardAware
    ? {
        behavior: Platform.OS === 'ios' ? 'padding' : undefined,
        style: layoutStyles.keyboardAvoidingView,
      }
    : {
        style: layoutStyles.body,
      };

  const content = (
    <View className={`w-full web:max-w-130 ${contentClassName}`} style={layoutStyles.content}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={[layoutStyles.safeArea, { backgroundColor: colors.background }]}
    >
      <Wrapper {...wrapperProps}>
        {header}
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={`py-7 ${scrollContentClassName}`}
            contentContainerStyle={layoutStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          <View className="flex-1 py-7" style={layoutStyles.body}>
            {content}
          </View>
        )}
        {footer}
        {showStaticFooter ? <StaticFooterMenu /> : null}
      </Wrapper>
    </SafeAreaView>
  );
}
