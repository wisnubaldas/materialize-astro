import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import fs from 'node:fs/promises'
import fg from 'fast-glob'
import matter from 'gray-matter'
import translateModule from '@vitalets/google-translate-api'

const googleTranslateFn =
  translateModule?.default?.translate ??
  translateModule?.translate ??
  (typeof translateModule === 'function' ? translateModule : null)

const GOOGLE_ENABLED =
  process.env.SYNC_DOCS_DISABLE_GOOGLE !== 'true' && typeof googleTranslateFn === 'function'

const LIBRE_URL =
  process.env.SYNC_DOCS_LIBRE_URL === 'false'
    ? null
    : process.env.SYNC_DOCS_LIBRE_URL || 'https://libretranslate.com/translate'

const LIBRE_API_KEY = process.env.SYNC_DOCS_LIBRE_API_KEY || process.env.LIBRE_TRANSLATE_API_KEY

const TRANSLATE_DELAY_MS = Number(process.env.SYNC_DOCS_DELAY_MS || 250)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const ID_ROOT = path.join(projectRoot, 'src', 'content', 'docs', 'id')
const EN_ROOT = path.join(projectRoot, 'src', 'content', 'docs', 'en')

const CODE_PLACEHOLDER_PATTERN = /__CODE_BLOCK_(\d+)__/g
const translationCache = new Map()

const logger = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})

const log = (...args) => {
  console.log(`[${logger.format(new Date())}]`, ...args)
}

async function main() {
  log('Syncing docs from "id" to "en"...')
  const entries = await fg('**/*', { cwd: ID_ROOT, dot: true })

  for (const entry of entries) {
    const source = path.join(ID_ROOT, entry)
    const target = path.join(EN_ROOT, entry)
    const stat = await fs.stat(source)

    if (stat.isDirectory()) {
      await fs.mkdir(target, { recursive: true })
      continue
    }

    await fs.mkdir(path.dirname(target), { recursive: true })

    if (!/\.(md|mdx)$/i.test(entry)) {
      await fs.copyFile(source, target)
      continue
    }

    log('Translating', entry)
    const raw = await fs.readFile(source, 'utf8')
    const { content, data } = matter(raw)

    const translatedFrontmatter = await translateFrontmatter(data)
    const translatedBody = await translateBody(content)

    const output = matter.stringify(translatedBody, translatedFrontmatter)
    await fs.writeFile(target, output, 'utf8')
  }

  log('Done!')
}

async function translateFrontmatter(frontmatter) {
  const result = {}
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === 'string') {
      result[key] = await translateText(value)
    } else {
      result[key] = value
    }
  }
  return result
}

function extractCodeBlocks(text) {
  const placeholders = []
  const replaced = text.replace(/```[\s\S]*?```/g, (match) => {
    const key = `__CODE_BLOCK_${placeholders.length}__`
    placeholders.push(match)
    return key
  })
  return { replaced, placeholders }
}

function restoreCodeBlocks(text, placeholders) {
  return text.replace(CODE_PLACEHOLDER_PATTERN, (_, index) => placeholders[Number(index)])
}

async function translateBody(content) {
  const { replaced, placeholders } = extractCodeBlocks(content)
  const segments = splitByPlaceholders(replaced)
  const translated = []

  for (const segment of segments) {
    if (!segment) continue
    if (isCodePlaceholder(segment)) {
      translated.push(segment)
      continue
    }

    const trimmed = segment.trim()
    if (!trimmed) {
      translated.push(segment)
      continue
    }

    if (trimmed.startsWith('<')) {
      translated.push(await translateComponentStrings(segment))
      continue
    }

    if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
      translated.push(segment)
      continue
    }

    translated.push(await translateTextPreserveWhitespace(segment))
  }

  const merged = translated.join('')
  return restoreCodeBlocks(merged, placeholders)
}

function splitByPlaceholders(text) {
  const segments = []
  let lastIndex = 0
  CODE_PLACEHOLDER_PATTERN.lastIndex = 0
  let match
  const regex = /(__CODE_BLOCK_\d+__)/g
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index))
    }
    segments.push(match[0])
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex))
  }
  return segments
}

async function translateComponentStrings(block) {
  const matches = [...block.matchAll(/(['"])([^'"`]*?)\1/g)]
  if (matches.length === 0) {
    return block
  }

  const parts = []
  let lastIndex = 0
  for (const match of matches) {
    const [full, quote, value] = match
    const shouldTranslate = needsTranslation(value)
    if (match.index > lastIndex) {
      parts.push(block.slice(lastIndex, match.index))
    }
    if (shouldTranslate) {
      const translated = await translateText(value)
      parts.push(quote + translated + quote)
    } else {
      parts.push(full)
    }
    lastIndex = match.index + full.length
  }
  if (lastIndex < block.length) {
    parts.push(block.slice(lastIndex))
  }
  return parts.join('')
}

function needsTranslation(text) {
  if (!text.trim()) return false
  // skip short tokens like ids or placeholders
  if (text.trim().length <= 2) return false
  return /[A-Za-zÀ-ÿ]/.test(text)
}

async function translateTextPreserveWhitespace(segment) {
  const leading = segment.match(/^\s*/)?.[0] ?? ''
  const trailing = segment.match(/\s*$/)?.[0] ?? ''
  const core = segment.trim()
  if (!core) return segment
  const translated = await translateText(core)
  return `${leading}${translated}${trailing}`
}

async function translateText(text) {
  const key = text.trim()
  if (!key) return text
  if (translationCache.has(key)) {
    return translationCache.get(key)
  }

  const translated = await translateViaProviders(text)
  translationCache.set(key, translated)
  if (TRANSLATE_DELAY_MS > 0) {
    await delay(TRANSLATE_DELAY_MS)
  }
  return translated
}

async function translateViaProviders(text) {
  const providers = []
  if (GOOGLE_ENABLED) {
    providers.push(() => translateWithRetry(() => googleTranslateFn(text, { to: 'en', from: 'auto' })).then((res) => res.text))
  }
  if (LIBRE_URL) {
    providers.push(() => translateWithRetry(() => libreTranslate(text)))
  }

  if (providers.length === 0) {
    throw new Error('No translation provider configured. Enable Google or set SYNC_DOCS_LIBRE_URL.')
  }

  let lastError
  for (const provider of providers) {
    try {
      return await provider()
    } catch (error) {
      lastError = error
      log(`Translation provider failed: ${error?.message ?? error}. Trying fallback...`)
    }
  }

  throw lastError ?? new Error('All translation providers failed')
}

async function translateWithRetry(operation, attempt = 1) {
  try {
    return await operation()
  } catch (error) {

    if (isRateLimitError(error) && attempt <= 5) {
      const waitMs = 500 * attempt * attempt
      log(`Rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/5)...`)
      await delay(waitMs)
      return translateWithRetry(operation, attempt + 1)
    }
    throw error
  }
}

function isRateLimitError(error) {
  return (
    error?.name === 'TooManyRequestsError' ||
    error?.statusCode === 429 ||
    /Too Many Requests/i.test(error?.message ?? '')
  )
}

async function libreTranslate(text) {
  const response = await fetch(LIBRE_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      q: text,
      source: 'auto',
      target: 'en',
      format: 'text',
      api_key: LIBRE_API_KEY || undefined
    })
  })

  if (!response.ok) {
    const error = new Error(`LibreTranslate HTTP ${response.status}`)
    error.statusCode = response.status
    error.body = await response.text().catch(() => undefined)
    throw error
  }

  const data = await response.json().catch(() => ({}))
  if (typeof data?.translatedText !== 'string') {
    throw new Error('Invalid response from LibreTranslate')
  }

  return data.translatedText
}

main().catch((error) => {
  console.error('Failed to sync docs:', error)
  process.exitCode = 1
})
function isCodePlaceholder(segment) {
  return /^__CODE_BLOCK_\d+__$/.test(segment.trim())
}
