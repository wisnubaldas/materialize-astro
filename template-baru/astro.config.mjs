// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
import react from '@astrojs/react';
// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  integrations: [react()],
  vite: {
    build: {
      minify: true,
      chunkSizeWarningLimit: 2000 // default 500kb → naik jadi 2mb
    },
    resolve: {
      alias: {
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@assets': '/src/assets',
        '@public': '/public'
      }
    }
  }
});