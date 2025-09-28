import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import { ensureDirectoryExistence } from './create-directory.js';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const isMinify: boolean = JSON.parse(process.env.MINIFY || 'false');
const dist: string = process.env.DIST || 'dist';
const argTargetFile: string | undefined = process.env.TARGET_FILE;

// 設定
const config = {
  dir: {
    scss: 'src/scss/', // SCSSファイルのディレクトリ
    dist: `${dist}/css/`,
  },
};

// 出力先のCSSファイルを削除
if (process.env.NODE_ENV !== 'production' && !argTargetFile) {
  glob.sync(`${config.dir.dist}/**/*.css`).forEach((file: string) => {
    fs.unlinkSync(file);
  });
}

// SCSSファイルをコンパイルする関数
const compileScss = (scssFilePath: string): string => {
  // CSSソースをresultに格納
  const result = sass.compile(scssFilePath, {
    style: isMinify ? 'compressed' : 'expanded',
    loadPaths: ['./src/scss/'],
  });

  return postcss([autoprefixer]).process(result.css.toString()).css;
};

// SCSSファイルを取得してコンパイル実行からファイル書き出し
const scssFiles: string[] = argTargetFile ? new Array(argTargetFile) : glob.sync(`${config.dir.scss}/**/!(_)*.scss`);
scssFiles.forEach((file: string) => {
  const cssFilePath = file.replace(config.dir.scss, config.dir.dist).replace('.scss', '.css');

  ensureDirectoryExistence(path.dirname(cssFilePath));
  const css = compileScss(file);
  fs.writeFileSync(cssFilePath, css);
  console.log(`\x1b[36;1m${file} -> ${cssFilePath} ...\x1b[0m`);
});