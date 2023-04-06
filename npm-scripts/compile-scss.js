const sass = require('sass');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const { ensureDirectoryExistence } = require('./create-directory');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// 圧縮するかどうかの判定
const isMinify = JSON.parse(process.env.MINIFY);

// コンパイルするSCSSファイルが格納されているディレクトリのパス
const scssDirPath = 'src/scss';

// コンパイル後のCSSファイルを出力するディレクトリのパス
const cssDirPath = 'dist/css';

// 出力先のCSSファイルを削除
if (process.env.NODE_ENV !== 'production') {
  glob.sync(`${cssDirPath}/**/*.css`).forEach((file) => {
    fs.unlinkSync(file);
  });
}

// SCSSファイルをコンパイルする関数
const compileScss = (scssFilePath) => {
  // 圧縮したCSSをresultに格納
  const result = sass.compile(scssFilePath, {
    style: isMinify ? 'compressed' : 'expanded',
  });

  return result.css.toString();
};

// SCSSファイルをコンパイルしてCSSファイルに出力する関数
const compileAllScssFiles = () => {
  const scssFiles = glob.sync(`${scssDirPath}/**/!(_)*.scss`);

  scssFiles.forEach((file) => {
    const cssFilePath = file.replace(scssDirPath, cssDirPath).replace('.scss', '.css');

    ensureDirectoryExistence(path.dirname(cssFilePath));
    const css = compileScss(file);
    fs.writeFileSync(cssFilePath, css);
    console.log(`\x1b[36;1m${file} -> ${cssFilePath} ...\x1b[0m`);
  });
};

compileAllScssFiles();
