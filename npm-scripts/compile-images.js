import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import imagemin from 'imagemin';
import imageminUpng from 'imagemin-upng';
import imageminSvgo from 'imagemin-svgo';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const dist = process.env.DIST;
const argTargetFile = process.env.TARGET_FILE;

// 設定
const config = {
  dir: {
    src: `src/images/`, // 画像ファイルのディレクトリ
    dist: `${dist}/images/`, // 出力先のディレクトリ
  },
  quality: {
    png: 256, // 0 or 256 = lossless, 1-255 = lossy
  },
};

// pngかsvgかを判定
const isValidFile = (file) => {
  const extension = path.basename(file).split('.').pop().toLowerCase();
  if (extension !== 'png' && extension !== 'svg') {
    return false;
  }
  return true;
};

const compressImages = async () => {
  if (!argTargetFile) await fs.promises.rm(config.dir.dist, { recursive: true, force: true });
  const pngFiles = glob.sync(`${config.dir.src}/**/*.png`);
  const svgFiles = glob.sync(`${config.dir.src}/**/*.svg`);

  const allFiles = argTargetFile ? [argTargetFile] : [...pngFiles, ...svgFiles];

  for (const file of allFiles) {
    const fileName = file.replace(config.dir.src, '');
    const buffer = await imagemin([file], {
      destination: path.join(config.dir.dist, path.dirname(fileName)),
      plugins: [
        imageminUpng({
          quality: config.quality.png,
        }),
        imageminSvgo(),
      ],
    });
    console.log(`\x1b[36;1mminify ${file} -> ${buffer[0].destinationPath}\x1b[0m`);
    fs.writeFileSync(buffer[0].destinationPath, buffer[0].data);
  }
};

// src/imagesフォルダの存在していればcompressImages()を実行
try {
  fs.accessSync(config.dir.src);
  // pngかsvgの対象ファイルが指定されているか、対象ファイルの指定がなければ実行
  if ((argTargetFile && isValidFile(argTargetFile)) || !argTargetFile) compressImages();
} catch (error) {
  console.log('\x1b[31;1mNo images directory\x1b[0m');
}
