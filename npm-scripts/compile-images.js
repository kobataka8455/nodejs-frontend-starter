const path = require('path');
const fs = require('fs');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');

const srcDir = path.resolve(process.cwd(), 'src', 'images');
const distDir = path.resolve(process.cwd(), 'dist', 'images');
const QUALITY = [0.6, 0.8];

async function compressImages() {
  fs.promises.rm(distDir, { recursive: true, force: true });
  const files = fs.readdirSync(srcDir);
  const pngFiles = files.filter((file) => path.extname(file) === '.png');
  const svgFiles = files.filter((file) => path.extname(file) === '.svg');

  for (const file of pngFiles) {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    const buffer = await imagemin([srcPath], {
      destination: distDir,
      plugins: [
        imageminPngquant({
          quality: QUALITY,
        }),
      ],
    });
    console.log(`\x1b[36;1mcopy ${srcPath.replace(process.cwd(), '')} -> ${distPath.replace(process.cwd(), '')}\x1b[0m`);
    fs.writeFileSync(distPath, buffer[0].data);
  }

  for (const file of svgFiles) {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    const buffer = await imagemin([srcPath], {
      destination: distDir,
      plugins: [imageminSvgo()],
    });
    console.log(`\x1b[36;1mcopy ${srcPath.replace(process.cwd(), '')} -> ${distPath.replace(process.cwd(), '')}\x1b[0m`);
    fs.writeFileSync(distPath, buffer[0].data);
  }
}

// src/imagesフォルダの存在していればcompressImages()を実行
try {
  fs.accessSync(srcDir);
  compressImages();
} catch (error) {
  console.log('\x1b[31;1mNo images directory\x1b[0m');
}
