import fs from 'fs';
import path from 'path';
import { minify } from 'terser';

// Folder hasil build yang akan diproses
const distFolders = ['dist/client/js', 'dist/client/_astro'];

let totalBefore = 0;
let totalAfter = 0;
let totalFiles = 0;

async function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const sizeBefore = Buffer.byteLength(code, 'utf8');
  totalBefore += sizeBefore;

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

    fs.writeFileSync(filePath, result.code, 'utf-8');

    const sizeAfter = Buffer.byteLength(result.code, 'utf8');
    totalAfter += sizeAfter;
    totalFiles++;

    const saved = ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
    const sizeBeforeKB = (sizeBefore / 1024).toFixed(2);
    const sizeAfterKB = (sizeAfter / 1024).toFixed(2);

    console.log(
      `✅ ${path.relative(
        process.cwd(),
        filePath
      )}: ${sizeBeforeKB}KB → ${sizeAfterKB}KB (${saved}% lebih kecil)`
    );
  } catch (err) {
    console.error(`❌ Gagal minify ${filePath}: ${err.message}`);
  }
}

for (const folder of distFolders) {
  const absPath = path.resolve(folder);
  if (!fs.existsSync(absPath)) {
    console.log(`⚠️  Folder ${folder} tidak ditemukan — lewati.`);
    continue;
  }

  console.log(`\n🚀 Memproses file JS di ${folder}...\n`);

  // Rekursif cari file .js
  const walk = (dir) => {
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (file.endsWith('.js')) processFile(full);
    }
  };

  walk(absPath);
}

// Ringkasan hasil akhir
process.on('beforeExit', () => {
  if (totalFiles === 0) {
    console.log('⚠️  Tidak ada file JS yang diproses.');
    return;
  }

  const saved = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
  const beforeKB = (totalBefore / 1024).toFixed(2);
  const afterKB = (totalAfter / 1024).toFixed(2);

  console.log(`\n📊 Ringkasan Minify:`);
  console.log(`   • File diproses : ${totalFiles}`);
  console.log(`   • Total sebelum : ${beforeKB} KB`);
  console.log(`   • Total sesudah : ${afterKB} KB`);
  console.log(`   • Penghematan   : ${saved}%`);
  console.log(`\n✨ Semua file JS selesai di-minify & dibersihkan!\n`);
});
