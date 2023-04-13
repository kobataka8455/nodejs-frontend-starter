import path from 'path';
import fs from 'fs';
import glob from 'glob';
import imagemin from 'imagemin';
import imageminUpng from 'imagemin-upng';
import imageminSvgo from 'imagemin-svgo';

const srcDir = path.resolve(process.cwd(), 'src', 'images');
const distDir = path.resolve(process.cwd(), 'dist', 'images');
const PNG_QUALITY = 256; // 0 or 256 = lossless, 1-255 = lossy

async function compressImages() {
  await fs.promises.rm(distDir, { recursive: true, force: true });
  const pngFiles = glob.sync(`${srcDir}/**/*.png`);
  const svgFiles = glob.sync(`${srcDir}/**/*.svg`);

  const allFiles = [...pngFiles, ...svgFiles];

  for (const file of allFiles) {
    const fileName = file.replace(srcDir, '');
    const buffer = await imagemin([file], {
      destination: path.join(distDir, path.dirname(fileName)),
      plugins: [
        imageminUpng({
          quality: PNG_QUALITY,
        }),
        imageminSvgo(),
      ],
    });
    console.log(`\x1b[36;1mminify ${file.replace(srcDir, 'src')} -> ${buffer[0].destinationPath.replace(distDir, 'dist')}\x1b[0m`);
    fs.writeFileSync(buffer[0].destinationPath, buffer[0].data);
  }
}

// src/imagesフォルダの存在していればcompressImages()を実行
try {
  fs.accessSync(srcDir);
  compressImages();
} catch (error) {
  console.log('\x1b[31;1mNo images directory\x1b[0m');
}
