// @ts-check
import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  output: "server",
  trailingSlash: "always",
  integrations: [mdx()],
  vite: {
    build: {
      minify: true,
    },
    // Tambahkan bagian resolve dan alias di sini
    resolve: {
      alias: {
        // Contoh alias untuk folder src
        "~": "src",
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
