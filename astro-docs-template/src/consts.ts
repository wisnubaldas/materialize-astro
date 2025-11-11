export const SITE = {
  title: 'MAU APP',
  description: 'Dokumentasi teknik aplikasi gudang',
  defaultLanguage: 'id-id'
} as const

export const OPEN_GRAPH = {
  image: {
    src: 'default-og-image.png',
    alt:
      'astro logo on a starry expanse of space,' +
      ' with a purple saturn-like planet floating in the right foreground'
  },
  twitter: 'astrodotbuild'
}

export const KNOWN_LANGUAGES = {
  English: 'en',
  Indonesia: 'id'
} as const
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES)

export const EDIT_URL = `#`

export const COMMUNITY_INVITE_URL = `#`

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
  indexName: 'XXXXXXXXXX',
  appId: 'XXXXXXXXXX',
  apiKey: 'XXXXXXXXXX'
}

export type Sidebar = Record<
  (typeof KNOWN_LANGUAGE_CODES)[number],
  Record<string, { text: string; link: string }[]>
>
export const SIDEBAR: Sidebar = {
  en: {
    'Section Header': [
      { text: 'Introduction', link: 'en/introduction' },
      { text: 'Diagram', link: 'en/page-2' },
    ],
    'Another Section': [{ text: 'Page 4', link: 'en/page-4' }]
  },
  id: {
    'Dokumentasi Teknis': [
      { text: 'Introduction', link: 'id/introduction' },
      { text: 'Diagram', link: 'id/page-2' },
    ],
    'Dokumentasi Aplikasi': [
      { text: 'Login', link: 'id/doc-app' },
      { text: 'HUBNET', link: 'id/doc-app/hubnet' }
    ],
    'Blog': [
      { text: '2025-11-10T04-19-12-217Z', link: 'id/artikel/2025-11-10t04-19-12-217z' },
      { text: '2025-11-10T04-29-28-237Z', link: 'id/artikel/2025-11-10t04-29-28-237z' },
      { text: '2025-11-10T04-30-30-047Z', link: 'id/artikel/2025-11-10t04-30-30-047z' },
      { text: '2025-11-11T15-23-13-809Z', link: 'id/artikel/2025-11-11t15-23-13-809z' }

    ]
  }
}
