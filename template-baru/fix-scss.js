import fs from 'fs';
import { glob } from 'glob';

glob('src/**/*.scss').then(files => {
  files.forEach(file => {
    let scss = fs.readFileSync(file, 'utf8');

    scss = scss.replace(/(\n\s*)(--[a-zA-Z0-9\-\#\{\}]+:[^;]+;)/g, '$1& {\n$1  $2\n$1}');

    fs.writeFileSync(file, scss, 'utf8');
    console.log('Fixed:', file);
  });
});
