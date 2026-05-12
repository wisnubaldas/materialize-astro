/**
 * Capacitor configuration for Android packaging.
 * Keep webDir aligned with the Vite build output directory.
 */
const config = {
  appId: 'com.example.simplemobileapp',
  appName: 'Simple Mobile App',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
