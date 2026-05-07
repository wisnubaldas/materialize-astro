// @ts-check
import node from '@astrojs/node';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// @ts-ignore

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
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
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
        'react-apexcharts',
        'apexcharts',
        'flatpickr',
        'flatpickr/dist/plugins/monthSelect',
        'sweetalert2/dist/sweetalert2.esm.all.js',
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
      minify: 'terser', // bisa juga 'esbuild'
      terserOptions: {
        compress: true,
        mangle: true,
      },
    },
    plugins: [],
  },
});
