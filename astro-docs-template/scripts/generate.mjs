import path from 'node:path';
import fs from 'fs-extra';
import Handlebars from 'handlebars';

const TEMPLATE_PATH = './tub/content.tub.hbs';
const OUTPUT_DIR = './src/content/docs/id/artikel';
const SIDEBAR_PATH = './src/consts.ts';
const BLOG_SECTION_REGEX = /(\s*'Blog':\s*\[\s*)([\s\S]*?)(\s*\])/;

async function generateMarkdown() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const slug = timestamp.toLowerCase();
  const title = `${timestamp}`;
  const link = `id/artikel/${slug}`;

  const data = {
    title,
    desc: now.toLocaleDateString(),
  };

  try {
    const templateString = await fs.readFile(TEMPLATE_PATH, 'utf8');
    const template = Handlebars.compile(templateString);
    const output = template(data);

    await fs.ensureDir(OUTPUT_DIR);
    const outputPath = path.join(OUTPUT_DIR, `${slug}.mdx`);
    await fs.writeFile(outputPath, output);

    await appendBlogSidebarItem({ title, link });

    console.log(`[ok] Berhasil membuat: ${outputPath}`);
  } catch (error) {
    console.error('[err] Gagal membuat artikel:', error);
  }
}

async function appendBlogSidebarItem(newItem) {
  const sidebarContent = await fs.readFile(SIDEBAR_PATH, 'utf8');
  const match = sidebarContent.match(BLOG_SECTION_REGEX);

  if (!match) {
    throw new Error("Bagian 'Blog' pada sidebar tidak ditemukan.");
  }

  const [fullMatch, headerPart, innerItems, footerPart] = match;
  const items = parseBlogItems(innerItems);

  if (items.some((item) => item.link === newItem.link)) {
    return;
  }

  items.push({ text: newItem.title, link: newItem.link });

  const newline = sidebarContent.includes('\r\n') ? '\r\n' : '\n';
  const leadingWhitespace = headerPart.match(/^\s*/)?.[0] ?? '';
  const footerIndent = footerPart.match(/([ \t]*)\]/)?.[1] ?? '';
  const itemIndent = `${footerIndent}  `;

  const formattedItems = items
    .map(
      (item) =>
        `${itemIndent}{ text: '${escapeQuotes(item.text)}', link: '${escapeQuotes(item.link)}' }`
    )
    .join(`,${newline}`);

  const itemsBlock = items.length > 0 ? `${formattedItems}${newline}` : '';
  const newBlock = `${leadingWhitespace}'Blog': [${newline}${itemsBlock}${footerPart}`;
  const updatedSidebar = sidebarContent.replace(fullMatch, newBlock);

  await fs.writeFile(SIDEBAR_PATH, updatedSidebar);
}

function parseBlogItems(innerItems) {
  const matches = innerItems.matchAll(
    /\{\s*text:\s*'([^']*)',\s*link:\s*'([^']*)'\s*\}/g
  );

  return Array.from(matches, ([, text, link]) => ({ text, link }));
}

function escapeQuotes(value) {
  return String(value).replace(/'/g, "\\'");
}

generateMarkdown();
