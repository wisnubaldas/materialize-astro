// @ts-check
import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  trailingSlash: "always",
  adapter: node({
    mode: "standalone", // atau "middleware"
  }),
  integrations: [mdx()],
  vite: {
    build: {
      minify: true,
      chunkSizeWarningLimit: 2000, // default 500kb → naik jadi 2mb
    },

    // Tambahkan bagian resolve dan alias di sini
    resolve: {
      alias: {
        // Contoh alias untuk folder src
        "~": "src",
        "@modules": "node_modules",
        // Contoh alias untuk folder komponen
        "@css": "src/assets/css",
        // Contoh alias untuk folder layout
        "@js": "src/assets/js",
        "@json": "src/assets/json",
        "@img": "src/assets/img",
        "@svg": "src/assets/svg",
        "@vendor": "src/assets/vendor",
        "@components": "src/components",
        "@layouts": "src/layouts",
        "@pages": "src/pages",
        "@fonts": "src/assets/vendor/fonts",
      },
    },
  },
});
