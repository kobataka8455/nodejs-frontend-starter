import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import ejs from 'ejs';
import { minify } from 'html-minifier-terser';
import jsBeautify from 'js-beautify';
import { ensureDirectoryExistence } from './create-directory.js';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const isMinify = JSON.parse(process.env.MINIFY);
const isHTMLDir = JSON.parse(process.env.IS_HTML_DIR); // dist/配下にHTMLフォルダを作成するかどうか
const dist = process.env.DIST;
const ejsPath = process.env.EJS_PATH;
const HTMLFolder = isHTMLDir ? `${dist}/html/` : `${dist}/`;
const argTargetFile = process.env.TARGET_FILE;

// 設定
const config = {
  dir: {
    ejs: ejsPath, // EJSファイルのディレクトリ
  },
  ejsOptions: {
    root: `${path.resolve(process.cwd(), ejsPath)}`,
  },
  ejsData: {
    path: {
      ejs: '/',
      comp: '/components', // コンポーネントのパス（src/ejs/をrootとしたルート絶対パス）
    },
    files: glob.sync(`${ejsPath}**/!(_)*.ejs`),
  },
};

// 出力先のHTMLファイルを削除
if (process.env.NODE_ENV !== 'production' && !argTargetFile) {
  glob.sync(`${HTMLFolder}**/*.html`).forEach((file) => {
    fs.unlinkSync(file);
  });
}

// EJSファイルをコンパイルする関数
const compileTemplate = async (templatePath, data, options) => {
  const template = fs.readFileSync(templatePath, 'utf8');
  const compiledTemplate = ejs.render(template, data, options);

  // スペースやインデント起因の表示バグ等を回避のためフォーマットする
  const jsBeautifyOption = JSON.parse(fs.readFileSync('.ejsbrc.json', 'utf8'));
  const formatedTemplate = jsBeautify.html(compiledTemplate, jsBeautifyOption);
  // minify判定
  if (isMinify) {
    return await minify(formatedTemplate, {
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

// 引数があれば引数のファイルをコンパイルする、なければ全てのファイルをコンパイルする
const files = argTargetFile ? new Array(argTargetFile) : glob.sync(`${config.dir.ejs}/**/!(_)*.ejs`);
files.forEach(async (file) => {
  // EJSファイルのinclude相対パスを設定する
  config.ejsOptions.filename = file;
  // 静的ファイルへの相対パス設定
  const relativePath = path.relative(config.dir.ejs, file);
  const regex = /[\/]/g;
  // 相対パス
  const outputRelativePath = () => {
    const distLevel = isHTMLDir ? 1 : 0;
    const slashCount = (relativePath.match(regex) ? relativePath.match(regex).length : 0) + distLevel;
    if (slashCount === 0) {
      return '.';
    } else {
      return '../'.repeat(slashCount).slice(0, -1);
    }
  };

  config.ejsData.path.static = outputRelativePath();
  // EJSファイルをコンパイルする
  const compiledTemplate = await compileTemplate(file, config.ejsData, config.ejsOptions);
  // コンパイルされたHTMLを出力する
  const distPath = file.replace(config.dir.ejs, HTMLFolder).replace('.ejs', '.html');
  ensureDirectoryExistence(path.dirname(distPath));
  fs.writeFileSync(distPath, compiledTemplate);

  // 常にコンパイルする指定ファイルがあればコンパイル
  // if (files.length === 1 && !config.everReload.includes(file.replace(config.dir.ejs, ''))) {
  //   config.everReload.forEach(async (_file) => {
  //     console.log('hoge');
  //     const everFile = path.join(config.dir.ejs, _file);
  //     config.ejsOptions.filename = everFile;
  //     config.ejsData.path.static = path.relative(everFile, config.dir.ejs);
  //     const compiledTemplate = await compileTemplate(everFile, config.ejsData, config.ejsOptions);
  //     const distPath = everFile.replace(config.dir.ejs, HTMLFolder).replace('.ejs', '.html');
  //     fs.writeFileSync(distPath, compiledTemplate);
  //   });
  // }
  console.log(`\x1b[36;1m${file} -> ${distPath.replace('./', '')} ...\x1b[0m`);
});
