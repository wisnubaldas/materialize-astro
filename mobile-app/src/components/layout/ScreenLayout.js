import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const layoutStyles = {
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
 * Provides the default safe area, keyboard, and responsive content frame for mobile screens.
 * @param {{ children: React.ReactNode, header?: React.ReactNode, footer?: React.ReactNode, scroll?: boolean, keyboardAware?: boolean, contentClassName?: string, scrollContentClassName?: string }} props - Layout configuration.
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
}) {
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
    <View className={`w-full web:max-w-[520px] ${contentClassName}`} style={layoutStyles.content}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" style={layoutStyles.safeArea}>
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
      </Wrapper>
    </SafeAreaView>
  );
}
