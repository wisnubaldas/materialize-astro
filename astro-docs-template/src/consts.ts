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

export const EDIT_URL = `https://github.com/advanced-astro/astro-docs-template/tree/main`

export const COMMUNITY_INVITE_URL = `https://astro.build/chat`

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
      { text: 'Page 2', link: 'en/page-2' },
      { text: 'Page 3', link: 'en/page-3' }
    ],
    'Another Section': [{ text: 'Page 4', link: 'en/page-4' }]
  },
  id: {
    'Section Header': [
      { text: 'Introduction', link: 'id/introduction' },
      { text: 'Page 2', link: 'id/page-2' },
      { text: 'Page 3', link: 'id/page-3' }
    ],
    'Another Section': [{ text: 'Page 4', link: 'id/page-4' }],
    'Blog Bacaan': [
      { text: 'Install Supervisor', link: '#' },
      { text: 'Bikin Kancut', link: '#' }
    ]
  }
}
