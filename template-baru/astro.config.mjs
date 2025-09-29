// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';
// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

  integrations: [],
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
