import fs from 'fs';
import { glob } from 'glob';
import terser from '@rollup/plugin-terser';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const isMinify = JSON.parse(process.env.MINIFY);
const dist = process.env.DIST;
const argTargetFile = process.env.TARGET_FILE;

// rollupの設定
const setting = (name) => {
  return {
    input: name,
    output: {
      file: name.replace(`src/scripts`, `${dist}/scripts`),
      format: 'iife',
    },
    plugins: [isMinify ? terser({}) : null],
  };
};

// 出力先のJSファイルを削除
if (process.env.NODE_ENV !== 'production' && !argTargetFile) {
  glob.sync(`${dist}/scripts/**/*.js`).forEach((file) => {
    fs.unlinkSync(file);
  });
}
const files = argTargetFile ? new Array(argTargetFile) : glob.sync(`src/scripts/**/!(_)*.js`);
const settings = files.map((file) => setting(file));
export default settings;
