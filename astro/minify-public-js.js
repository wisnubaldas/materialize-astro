import CleanCSS from 'clean-css';
import fs from 'fs';
import path from 'path';
import { minify } from 'terser';

const JS_DIRECTORIES = ['dist/client/js', 'dist/client/_astro'];
const CSS_DIRECTORY = 'dist/client/assets';
const MINIFY_JS = process.env.MINIFY_JS === 'true';
const MINIFY_CSS = process.env.MINIFY_CSS !== 'false';

const totals = {
  css: { files: 0, before: 0, after: 0 },
  js: { files: 0, before: 0, after: 0 },
};

const formatKB = (bytes) => `${(bytes / 1024).toFixed(2)}KB`;

const calcSavedPercent = (before, after) => {
  if (before <= 0) {
    return '0.0';
  }
  return ((1 - after / before) * 100).toFixed(1);
};

const walkFiles = (directory, extension) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, extension));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
};

const minifyCssFile = (filePath) => {
  const originalCss = fs.readFileSync(filePath, 'utf-8');
  const sizeBefore = Buffer.byteLength(originalCss, 'utf8');

  const cleanCss = new CleanCSS({
    level: 2,
    inline: false,
    rebaseTo: path.dirname(filePath),
  });

  const result = cleanCss.minify({
    [filePath]: {
      styles: originalCss,
    },
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors.join(', '));
  }

  const minifiedCss = result.styles;
  fs.writeFileSync(filePath, minifiedCss, 'utf-8');

  const sizeAfter = Buffer.byteLength(minifiedCss, 'utf8');
  totals.css.files += 1;
  totals.css.before += sizeBefore;
  totals.css.after += sizeAfter;

  console.log(
    `[minify][css] ${path.relative(process.cwd(), filePath)}: ${formatKB(sizeBefore)} -> ${formatKB(
      sizeAfter
    )} (${calcSavedPercent(sizeBefore, sizeAfter)}% smaller)`
  );
};

const processCssDirectory = () => {
  const absoluteCssDirectory = path.resolve(CSS_DIRECTORY);
  if (!fs.existsSync(absoluteCssDirectory)) {
    console.log(`[minify][css] Skip: folder not found (${CSS_DIRECTORY})`);
    return;
  }

  const cssFiles = walkFiles(absoluteCssDirectory, '.css');
  if (cssFiles.length === 0) {
    console.log('[minify][css] No CSS files found.');
    return;
  }

  console.log(`\n[minify][css] Processing ${cssFiles.length} file(s) from ${CSS_DIRECTORY}`);

  for (const filePath of cssFiles) {
    try {
      minifyCssFile(filePath);
    } catch (error) {
      console.error(
        `[minify][css] Failed: ${path.relative(process.cwd(), filePath)} | ${error.message}`
      );
    }
  }
};

const minifyJsFile = async (filePath) => {
  const originalJs = fs.readFileSync(filePath, 'utf-8');
  const sizeBefore = Buffer.byteLength(originalJs, 'utf8');

  try {
    const result = await minify(originalJs, {
      ecma: 2020,
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn'],
        passes: 3,
      },
      format: {
        comments: false,
      },
      mangle: {
        toplevel: true,
      },
    });

    const minifiedJs = result.code ?? originalJs;
    fs.writeFileSync(filePath, minifiedJs, 'utf-8');

    const sizeAfter = Buffer.byteLength(minifiedJs, 'utf8');
    totals.js.files += 1;
    totals.js.before += sizeBefore;
    totals.js.after += sizeAfter;

    console.log(
      `[minify][js] ${path.relative(process.cwd(), filePath)}: ${formatKB(sizeBefore)} -> ${formatKB(
        sizeAfter
      )} (${calcSavedPercent(sizeBefore, sizeAfter)}% smaller)`
    );
  } catch (error) {
    console.error(`[minify][js] Failed: ${path.relative(process.cwd(), filePath)} | ${error.message}`);
  }
};

const processJsDirectory = async (directory) => {
  const absoluteDirectory = path.resolve(directory);
  if (!fs.existsSync(absoluteDirectory)) {
    console.log(`[minify][js] Skip: folder not found (${directory})`);
    return;
  }

  const jsFiles = walkFiles(absoluteDirectory, '.js');
  if (jsFiles.length === 0) {
    console.log(`[minify][js] Skip: no JS files in ${directory}`);
    return;
  }

  console.log(`\n[minify][js] Processing ${jsFiles.length} file(s) from ${directory}`);

  for (const filePath of jsFiles) {
    await minifyJsFile(filePath);
  }
};

const printSummary = () => {
  if (totals.css.files > 0) {
    console.log('\n[minify][summary] CSS');
    console.log(`  files   : ${totals.css.files}`);
    console.log(`  before  : ${formatKB(totals.css.before)}`);
    console.log(`  after   : ${formatKB(totals.css.after)}`);
    console.log(`  saving  : ${calcSavedPercent(totals.css.before, totals.css.after)}%`);
  } else {
    console.log('\n[minify][summary] CSS: no files processed');
  }

  if (totals.js.files > 0) {
    console.log('[minify][summary] JS');
    console.log(`  files   : ${totals.js.files}`);
    console.log(`  before  : ${formatKB(totals.js.before)}`);
    console.log(`  after   : ${formatKB(totals.js.after)}`);
    console.log(`  saving  : ${calcSavedPercent(totals.js.before, totals.js.after)}%`);
  } else {
    console.log('[minify][summary] JS: no files processed');
  }
};

const main = async () => {
  if (MINIFY_CSS) {
    processCssDirectory();
  } else {
    console.log('[minify][css] Skip: MINIFY_CSS=false');
  }

  if (MINIFY_JS) {
    for (const directory of JS_DIRECTORIES) {
      await processJsDirectory(directory);
    }
  } else {
    console.log('[minify][js] Skip: Astro/Vite already minifies JS. Set MINIFY_JS=true to run post-build JS minify.');
  }

  printSummary();
};

main().catch((error) => {
  console.error(`[minify] Fatal error: ${error.message}`);
  process.exit(1);
});
