// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import sass from 'sass';

// Configure Astro for SSR using the Node adapter and enable React components.
export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@js': '/src/js',
        '@scss': '/src/scss',
        '@vendor': '/src/vendor',
        '@lib': '/src/lib',
        '@libs': '/src/libs',
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['color-functions', 'import', 'global-builtin'], // <--- ini menonaktifkan warning color-functions
        },
      },
    },
  },
});
