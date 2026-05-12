import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the JavaScript-only Ionic React application.
 * The build output must stay as "dist" because Capacitor copies this folder
 * into the native Android project during sync.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'mobile-ui-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            '@ionic/react',
            '@ionic/react-router',
            'ionicons'
          ],
          'capacitor-vendor': ['@capacitor/core', '@capacitor/network', '@capacitor/preferences']
        }
      }
    },
    chunkSizeWarningLimit: 1300
  },
  server: {
    host: '0.0.0.0',
    port: 8100
  }
});
