import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import { ensureDirectoryExistence } from './create-directory.js';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const isMinify = JSON.parse(process.env.MINIFY);
const dist = process.env.DIST;
const argTargetFile = process.env.TARGET_FILE;

// 設定
const config = {
  dir: {
    scss: 'src/scss/', // SCSSファイルのディレクトリ
    dist: `${dist}/css/`,
  },
  ejsOptions: {
    root: `${path.resolve(process.cwd(), 'src/ejs/')}`,
  },
  ejsData: {
    path: {
      comp: '/components', // コンポーネントのパス（src/ejs/をrootとしたルート絶対パス）
    },
  },
};

// 出力先のCSSファイルを削除
if (process.env.NODE_ENV !== 'production' && !argTargetFile) {
  glob.sync(`${config.dir.dist}/**/*.css`).forEach((file) => {
    fs.unlinkSync(file);
  });
}

// SCSSファイルをコンパイルする関数
const compileScss = (scssFilePath) => {
  // CSSソースをresultに格納
  const result = sass.compile(scssFilePath, {
    style: isMinify ? 'compressed' : 'expanded',
    loadPaths: ['./src/scss/'],
  });

  return postcss([autoprefixer]).process(result.css.toString()).css;
};

// SCSSファイルを取得してコンパイル実行からファイル書き出し
const scssFiles = argTargetFile ? new Array(argTargetFile) : glob.sync(`${config.dir.scss}/**/!(_)*.scss`);
scssFiles.forEach((file) => {
  const cssFilePath = file.replace(config.dir.scss, config.dir.dist).replace('.scss', '.css');

  ensureDirectoryExistence(path.dirname(cssFilePath));
  const css = compileScss(file);
  fs.writeFileSync(cssFilePath, css);
  console.log(`\x1b[36;1m${file} -> ${cssFilePath} ...\x1b[0m`);
});
