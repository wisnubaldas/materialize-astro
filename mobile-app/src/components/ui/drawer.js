import React from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import { cn } from './utils/cn';
import { getThemeColors } from '../../styles/theme';

const drawerStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  closeArea: {
    flex: 1,
  },
  panel: {
    height: '100%',
    borderRightWidth: 1,
    elevation: 18,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  panelRight: {
    borderLeftWidth: 1,
    borderRightWidth: 0,
    shadowOffset: { width: -4, height: 0 },
  },
  panelInner: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
};

/**
 * Renders a modal drawer shell with a dark backdrop.
 * @param {{ visible: boolean, onClose: Function, side?: 'left'|'right', children?: React.ReactNode }} props - Drawer props.
 * @returns {React.ReactElement} Drawer modal.
 */
export function Drawer({ visible, onClose, side = 'left', children }) {
  const directionStyle = side === 'right' ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[drawerStyles.overlay, directionStyle]}>
        {children}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={onClose}
          style={drawerStyles.closeArea}
        />
      </View>
    </Modal>
  );
}

/**
 * Renders the drawer panel surface.
 * @param {{ className?: string, side?: 'left'|'right', children?: React.ReactNode }} props - Drawer panel props.
 * @returns {React.ReactElement} Drawer panel.
 */
export function DrawerPanel({ className = '', side = 'left', children }) {
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme);
  const panelWidth = Math.min(Math.round(width * 0.9), 380);
  const sideStyle = side === 'right' ? drawerStyles.panelRight : null;
  const panelColorStyle = {
    backgroundColor: colors.background,
    borderLeftColor: colors.border,
    borderRightColor: colors.border,
    shadowColor: colors.foreground,
  };

  return (
    <SafeAreaView
      className={cn('web:max-w-[380px]', className)}
      style={[drawerStyles.panel, panelColorStyle, sideStyle, { width: panelWidth }]}
    >
      <View style={drawerStyles.panelInner}>{children}</View>
    </SafeAreaView>
  );
}

/**
 * Renders a drawer header section.
 * @param {{ className?: string, children?: React.ReactNode }} props - Drawer header props.
 * @returns {React.ReactElement} Drawer header.
 */
export function DrawerHeader({ className = '', ...props }) {
  return <View className={cn('gap-3 pb-6', className)} {...props} />;
}

/**
 * Renders the main drawer content section.
 * @param {{ className?: string, children?: React.ReactNode }} props - Drawer content props.
 * @returns {React.ReactElement} Drawer content.
 */
export function DrawerContent({ className = '', ...props }) {
  return <View className={cn('flex-1 gap-3', className)} {...props} />;
}

/**
 * Renders a drawer footer section.
 * @param {{ className?: string, children?: React.ReactNode }} props - Drawer footer props.
 * @returns {React.ReactElement} Drawer footer.
 */
export function DrawerFooter({ className = '', ...props }) {
  return <View className={cn('gap-4 pt-6', className)} {...props} />;
}
