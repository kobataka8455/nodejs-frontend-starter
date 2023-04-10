import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import glob from 'glob';
import { minify } from 'html-minifier';
import jsBeautify from 'js-beautify';
import { ensureDirectoryExistence } from './create-directory.js';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

const jsBeautifyOption = JSON.parse(fs.readFileSync('.ejsbrc.json', 'utf8'));

// 圧縮するかどうかの判定
const isMinify = JSON.parse(process.env.MINIFY);

// EJSテンプレートファイルのディレクトリ
const templatesDir = 'src/ejs/';

// コンパイルされたHTMLファイルの出力先ディレクトリ
const distDir = 'dist/html/';

// 出力先のHTMLファイルを削除
if (process.env.NODE_ENV !== 'production') {
  glob.sync(`${distDir}/**/*.html`).forEach((file) => {
    fs.unlinkSync(file);
  });
}

// テンプレートファイルをコンパイルする関数
const compileTemplate = (templatePath, data, options) => {
  const template = fs.readFileSync(templatePath, 'utf8');
  const compiledTemplate = ejs.render(template, data, options);

  // スペースやインデント起因の表示バグ等を回避のためフォーマットする
  const formatedTemplate = jsBeautify.html(compiledTemplate, jsBeautifyOption);

  // minify判定
  if (isMinify) {
    return minify(formatedTemplate, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
      minifyURLs: true,
      decodeEntities: true,
      removeRedundantAttributes: true,
    });
  } else {
    return formatedTemplate;
  }
};

// ディレクトリ内のすべてのEJSファイルを取得する
const files = glob.sync(`${templatesDir}/**/!(_)*.ejs`);
files.forEach((file) => {
  // コンパイルに必要なデータを用意する
  const config = {
    root: `${path.resolve(process.cwd(), './', templatesDir)}/`,
  };

  // コンパイルに必要なデータを用意する
  const data = {
    path: {
      comp: `/components`,
    },
  };

  // テンプレートをコンパイルする
  const compiledTemplate = compileTemplate(file, data, config);

  // コンパイルされたHTMLを出力する
  const distPath = file.replace(templatesDir, distDir).replace('.ejs', '.html');
  ensureDirectoryExistence(path.dirname(distPath));
  fs.writeFileSync(distPath, compiledTemplate);
  console.log(`\x1b[36;1m${file} -> ${distPath.replace('./', '')} ...\x1b[0m`);
});
