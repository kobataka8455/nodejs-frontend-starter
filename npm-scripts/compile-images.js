const path = require('path');
const fs = require('fs');
const glob = require('glob');
const imagemin = require('imagemin');
const imageminSvgo = require('imagemin-svgo');
const { ImagePool } = require('@squoosh/lib');
const imagePool = new ImagePool();

const srcDir = path.resolve(process.cwd(), 'src', 'images');
const distDir = path.resolve(process.cwd(), 'dist', 'images');
const QUALITY = [0.6, 0.8];

async function compressImages() {
  fs.promises.rm(distDir, { recursive: true, force: true });
  // const files = fs.readdirSync(srcDir);
  // const imgFiles = files.filter((file) => {
  //   const regex = /\.(jpe?g|png|svg)$/i;
  //   return regex.test(file);
  // });
  const pngFiles = glob.sync(`${srcDir}/**/*.png`);
  const svgFiles = glob.sync(`${srcDir}/**/*.svg`);
  const imageFileList = [...pngFiles, ...svgFiles];

  const imagePoolList = imageFileList.map((file) => {
    const imageFile = fs.readFileSync(file);
    const image = imagePool.ingestImage(imageFile);
    const filename = file.replace(srcDir, '');
    return { name: filename, image };
  });
  // const jpgEncodeOptions = {
  //   mozjpeg: { quality: 75 },
  // };

  // PNGの圧縮オプション
  const pngEncodeOptions = {
    oxipng: {
      effort: 2,
    },
  };
  // JPEGならMozJPEGに、PNGならOxipngに圧縮する
  await Promise.all(
    imagePoolList.map(async (item) => {
      const image = item.image;
      // if (/\.(jpe?g)$/i.test(item.name)) {
      //   await image.encode(jpgEncodeOptions);
      // }
      if (/\.(png)$/i.test(item.name)) {
        await image.encode(pngEncodeOptions);
      }
    })
  );

  // 圧縮したデータを出力する
  for (const item of imagePoolList) {
    const name = item.name;
    const encodedWith = item.image.encodedWith;

    // const {
    //   name,
    //   image: { encodedWith },
    // } = item;

    // 圧縮したデータを格納する変数
    let data;

    // JPGならMozJPEGで圧縮したデータを取得
    if (encodedWith.mozjpeg) {
      data = await encodedWith.mozjpeg;
    }
    // PNGならOxiPNGで圧縮したデータを取得
    if (encodedWith.oxipng) {
      data = await encodedWith.oxipng;
    }
    // 出力先フォルダがなければ作成
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }
    // ファイルを書き込む
    await fs.writeFile(`${distDir}/optimized_${name}`, data.binary);
  }
  // for (const file of pngFiles) {
  // const imageFile = fs.readFileSync(file);
  // const image = imagePool.ingestImage(imageFile);

  //   const srcPath = path.join(srcDir, file);
  //   const distPath = path.join(distDir, file);
  //   const buffer = await imagemin([srcPath], {
  //     destination: distDir,
  //     plugins: [
  //       imageminPngquant({
  //         quality: QUALITY,
  //       }),
  //     ],
  //   });
  //   console.log(`\x1b[36;1mcopy ${srcPath.replace(process.cwd(), '')} -> ${distPath.replace(process.cwd(), '')}\x1b[0m`);
  // fs.writeFileSync(distPath, buffer[0].data);
  // }

  // for (const file of svgFiles) {
  //   const srcPath = path.join(srcDir, file);
  //   const distPath = path.join(distDir, file);
  //   const buffer = await imagemin([srcPath], {
  //     destination: distDir,
  //     plugins: [imageminSvgo()],
  //   });
  //   console.log(`\x1b[36;1mcopy ${srcPath.replace(process.cwd(), '')} -> ${distPath.replace(process.cwd(), '')}\x1b[0m`);
  //   fs.writeFileSync(distPath, buffer[0].data);
  // }
}

// src/imagesフォルダの存在していればcompressImages()を実行
try {
  fs.accessSync(srcDir);
  compressImages();
} catch (error) {
  console.log('\x1b[31;1mNo images directory\x1b[0m');
}
