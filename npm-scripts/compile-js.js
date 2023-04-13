import fs from 'fs';
import glob from 'glob';
import terser from '@rollup/plugin-terser';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

const isMinify = JSON.parse(process.env.MINIFY);

const setting = (name) => {
  return {
    input: name,
    output: {
      file: name.replace('src/scripts', 'dist/scripts'),
      format: 'iife',
    },
    plugins: [isMinify ? terser({}) : null],
  };
};

// 出力先のJSファイルを削除
if (process.env.NODE_ENV !== 'production') {
  glob.sync(`dist/scripts/**/*.js`).forEach((file) => {
    fs.unlinkSync(file);
  });
}
const settings = glob.sync('src/scripts/**/!(_)*.js').map((file) => setting(file));
export default settings;
