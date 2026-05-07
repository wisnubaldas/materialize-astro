// @ts-check
import node from '@astrojs/node';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// @ts-ignore

const resolveManualChunk = (id) => {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (id.includes('react') || id.includes('scheduler')) {
    return 'framework-react';
  }

  if (id.includes('datatables.net') || id.includes('jquery')) {
    return 'vendor-datatables';
  }

  if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
    return 'vendor-chartjs';
  }

  if (id.includes('bootstrap') || id.includes('@popperjs') || id.includes('perfect-scrollbar')) {
    return 'vendor-ui-core';
  }

  if (id.includes('sweetalert2') || id.includes('react-select') || id.includes('flatpickr')) {
    return 'vendor-ui-widgets';
  }

  return 'vendor-misc';
};

// Configure Astro for SSR using the Node adapter and enable React components.
export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@components': fileURLToPath(new URL('./src/components/react', import.meta.url)),
        '@components-react': fileURLToPath(new URL('./src/components/react', import.meta.url)),
        '@components-astro': fileURLToPath(new URL('./src/components/astro', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@js': fileURLToPath(new URL('./src/js', import.meta.url)),
        '@scss': fileURLToPath(new URL('./src/scss', import.meta.url)),
        '@vendor': fileURLToPath(new URL('./src/vendor', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
        '@libs': fileURLToPath(new URL('./src/libs', import.meta.url)),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'flatpickr',
        'flatpickr/dist/plugins/monthSelect',
        'sweetalert2',
      ],
    },

    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['color-functions', 'import', 'global-builtin'], // <--- ini menonaktifkan warning color-functions
        },
      },
    },
    build: {
      minify: 'terser',
      cssCodeSplit: true,
      terserOptions: {
        compress: true,
        mangle: true,
      },
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
        },
      },
    },
    plugins: [],
  },
});
