// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { remarkMermaid } from 'remark-mermaidjs';
import starlightThemeObsidian from 'starlight-theme-obsidian';
import remarkMermaidDefaults from './src/plugins/remarkMermaidDefaults.mjs';
// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkMermaidDefaults,
      // @ts-ignore
      [
        remarkMermaid,
        {
          theme: 'forest',
          themeVariables: {
            primaryColor: '#BB2528',
            primaryTextColor: '#fff',
            primaryBorderColor: '#7C0000',
            lineColor: '#F8B229',
            secondaryColor: '#006100',
            tertiaryColor: '#fff',
          },
        },
      ],
    ],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'dracula',
      },
    },
  },
  integrations: [
    starlight({
      title: 'MAU APP DOC',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Indonesia',
          lang: 'id-ID',
        },
        en: {
          label: 'English',
          lang: 'en-EN',
        },
      },
      social: [
        {
          icon: 'gitlab',
          label: 'Gitlab',
          href: 'https://gitlab.att.id/mau/mau-app.git',
        },
      ],
      plugins: [starlightThemeObsidian()],
      customCss: ['./src/fonts/ubuntu.css', './src/styles/custom.css'],
      sidebar: [
        {
          label: 'Home',
          slug: '',
        },
        {
          label: 'Arsitektur',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Diagram', slug: 'id/architecture/diagram' },
            { label: 'Code', slug: 'id/architecture/code_trick' },
          ],
        },
      ],
    }),
  ],
});
