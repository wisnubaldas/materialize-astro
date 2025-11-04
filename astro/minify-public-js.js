import CleanCSS from 'clean-css';
import fs from 'fs';
import path from 'path';
import { minify } from 'terser';

// Folder hasil build yang akan diproses
const distFolders = ['dist/client/js', 'dist/client/_astro'];
const cssDir = 'dist/client/assets';

const cssTotals = {
  files: 0,
  before: 0,
  after: 0,
};

const jsTotals = {
  files: 0,
  before: 0,
  after: 0,
};

function collectCssFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCssFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

function minifyCssFiles() {
  const absCssDir = path.resolve(cssDir);
  if (!fs.existsSync(absCssDir)) {
    console.log(`??  Folder CSS ${cssDir} tidak ditemukan - lewati.`);
    return;
  }

  console.log(`\n?? Memproses file CSS di ${cssDir}...\n`);

  const cssFiles = collectCssFiles(absCssDir);

  if (cssFiles.length === 0) {
    console.log('??  Tidak ada file CSS yang diproses.');
    return;
  }

  for (const filePath of cssFiles) {
    try {
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
        console.error(
          `? Gagal minify CSS ${path.relative(process.cwd(), filePath)}: ${result.errors.join(
            ', '
          )}`
        );
        continue;
      }

      const minifiedCss = result.styles;
      fs.writeFileSync(filePath, minifiedCss, 'utf-8');

      const sizeAfter = Buffer.byteLength(minifiedCss, 'utf8');
      cssTotals.files += 1;
      cssTotals.before += sizeBefore;
      cssTotals.after += sizeAfter;

      const saved = sizeBefore === 0 ? '0.0' : ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
      const sizeBeforeKB = (sizeBefore / 1024).toFixed(2);
      const sizeAfterKB = (sizeAfter / 1024).toFixed(2);

      console.log(
        `? ${path.relative(
          process.cwd(),
          filePath
        )}: ${sizeBeforeKB}KB  ${sizeAfterKB}KB (${saved}% lebih kecil)`
      );
    } catch (err) {
      console.error(`? Gagal membaca CSS ${filePath}: ${err.message}`);
    }
  }
}

async function processJsFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const sizeBefore = Buffer.byteLength(code, 'utf8');
  jsTotals.before += sizeBefore;

  try {
    const result = await minify(code, {
      ecma: 2020,
      compress: {
        drop_console: true, // hapus semua console.log
        drop_debugger: true, // hapus debugger
        pure_funcs: ['console.info', 'console.debug', 'console.warn'],
        passes: 3, // optimasi berulang
      },
      format: {
        comments: false, // hapus semua komentar
      },
      mangle: {
        toplevel: true, // ubah nama variabel jadi pendek
      },
    });

    const minifiedCode = result.code ?? code;
    fs.writeFileSync(filePath, minifiedCode, 'utf-8');

    const sizeAfter = Buffer.byteLength(minifiedCode, 'utf8');
    jsTotals.after += sizeAfter;
    jsTotals.files += 1;

    const saved = sizeBefore === 0 ? '0.0' : ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
    const sizeBeforeKB = (sizeBefore / 1024).toFixed(2);
    const sizeAfterKB = (sizeAfter / 1024).toFixed(2);

    console.log(
      `? ${path.relative(
        process.cwd(),
        filePath
      )}: ${sizeBeforeKB}KB  ${sizeAfterKB}KB (${saved}% lebih kecil)`
    );
  } catch (err) {
    console.error(`? Gagal minify JS ${filePath}: ${err.message}`);
  }
}

async function processJsFolder(folder) {
  const absPath = path.resolve(folder);
  if (!fs.existsSync(absPath)) {
    console.log(`??  Folder ${folder} tidak ditemukan - lewati.`);
    return;
  }

  console.log(`\n?? Memproses file JS di ${folder}...\n`);

  const jsFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.js')) {
        jsFiles.push(fullPath);
      }
    }
  };

  walk(absPath);

  await Promise.all(jsFiles.map((file) => processJsFile(file)));
}

async function main() {
  minifyCssFiles();
  for (const folder of distFolders) {
    await processJsFolder(folder);
  }
}

main().catch((err) => {
  console.error(`? Proses minify berhenti dengan error: ${err.message}`);
  process.exit(1);
});

process.on('beforeExit', () => {
  if (cssTotals.files > 0) {
    const savedCss =
      cssTotals.before === 0 ? '0.0' : ((1 - cssTotals.after / cssTotals.before) * 100).toFixed(1);
    const cssBeforeKB = (cssTotals.before / 1024).toFixed(2);
    const cssAfterKB = (cssTotals.after / 1024).toFixed(2);

    console.log(`\n?? Ringkasan Minify CSS:`);
    console.log(`    File diproses : ${cssTotals.files}`);
    console.log(`    Total sebelum : ${cssBeforeKB} KB`);
    console.log(`    Total sesudah : ${cssAfterKB} KB`);
    console.log(`    Penghematan   : ${savedCss}%`);
  } else {
    console.log('??  Tidak ada file CSS yang diproses.');
  }

  if (jsTotals.files === 0) {
    console.log('??  Tidak ada file JS yang diproses.');
    return;
  }

  const savedJs =
    jsTotals.before === 0 ? '0.0' : ((1 - jsTotals.after / jsTotals.before) * 100).toFixed(1);
  const jsBeforeKB = (jsTotals.before / 1024).toFixed(2);
  const jsAfterKB = (jsTotals.after / 1024).toFixed(2);

  console.log(`\n?? Ringkasan Minify JS:`);
  console.log(`    File diproses : ${jsTotals.files}`);
  console.log(`    Total sebelum : ${jsBeforeKB} KB`);
  console.log(`    Total sesudah : ${jsAfterKB} KB`);
  console.log(`    Penghematan   : ${savedJs}%`);
  console.log(`\n? Semua file JS selesai di-minify & dibersihkan!\n`);
});
