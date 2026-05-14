import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from './button';
import { Text } from './text';
import { useThemeColors } from '../../styles/theme';

const cameraPreviewStyle = {
  flex: 1,
};

/**
 * Renders a QR scanner modal backed by Expo Camera.
 * @param {{ visible: boolean, title: string, description?: string, onClose: Function, onScanned: Function }} props - Scanner props.
 * @returns {React.ReactElement} QR scanner modal.
 */
export function QrScanner({ visible, title, description = '', onClose, onScanned }) {
  const colors = useThemeColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  /**
   * Requests camera access from the operating system.
   * @returns {Promise<void>} Resolves after permission prompt finishes.
   */
  async function handleRequestPermission() {
    await requestPermission();
  }

  /**
   * Sends scanned QR data to the caller once per modal session.
   * @param {{ data?: string }} result - Barcode scanning result.
   * @returns {void}
   */
  function handleBarcodeScanned(result) {
    if (hasScanned || !result?.data) {
      return;
    }

    setHasScanned(true);
    onScanned(result.data.trim());
  }

  /**
   * Closes the scanner and resets scan throttling.
   * @returns {void}
   */
  function handleClose() {
    setHasScanned(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <View className="flex-1 bg-slate-950">
        <View className="flex-row items-center justify-between px-6 pb-4 pt-14">
          <View className="flex-1 pr-4">
            <Text className="text-2xl font-black text-white">{title}</Text>
            {description ? <Text className="mt-1 text-sm leading-5 text-slate-300">{description}</Text> : null}
          </View>
          <Button variant="ghost" size="icon" className="bg-white/10" textClassName="text-white" onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </Button>
        </View>

        {permission?.granted ? (
          <View className="flex-1 overflow-hidden rounded-t-sm bg-black">
            <CameraView
              facing="back"
              style={cameraPreviewStyle}
              onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <View className="absolute inset-0 items-center justify-center px-8">
              <View className="h-64 w-64 rounded-sm border-4 border-white/90 bg-transparent" />
              <Text className="mt-6 text-center text-base font-semibold text-white">
                Arahkan kamera ke QR code
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-full rounded-sm bg-card p-6" style={{ backgroundColor: colors.card }}>
              <View className="h-14 w-14 items-center justify-center rounded-sm bg-muted" style={{ backgroundColor: colors.mutedBackground }}>
                <MaterialCommunityIcons name="camera-outline" size={28} color={colors.primary} />
              </View>
              <Text className="mt-5 text-2xl font-black text-foreground">Izinkan akses kamera</Text>
              <Text variant="muted" className="mt-2">
                Kamera diperlukan untuk membaca QR code AWB/MAWB dan ULD. Data hasil scan hanya mengisi form ini.
              </Text>
              <Button className="mt-6" onPress={handleRequestPermission}>
                <Text>Izinkan kamera</Text>
              </Button>
              <Button variant="ghost" className="mt-2" onPress={handleClose}>
                <Text>Batal</Text>
              </Button>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
