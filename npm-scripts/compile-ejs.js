import path from 'path';
import fs from 'fs';
import glob from 'glob';
import ejs from 'ejs';
import { minify } from 'html-minifier';
import jsBeautify from 'js-beautify';
import { ensureDirectoryExistence } from './create-directory.js';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const isMinify = JSON.parse(process.env.MINIFY);
const dist = process.env.DIST;

// 設定
const config = {
  dir: {
    ejs: 'src/ejs/', // EJSテンプレートファイルのディレクトリ
  },
  isHTMLDir: true, // dist/配下にHTMLフォルダを作成するかどうか
  ejsOptions: {
    root: `${path.resolve(process.cwd(), 'src/ejs/')}`,
  },
  ejsData: {
    path: {
      comp: '/components', // コンポーネントのパス（src/ejs/をrootとしたルート絶対パス）
    },
    func: {
      replacePath: (path) => {
        // ここだけ確認
        return config.isHTMLDir ? path.replace(/\//i, '') : path.replace(/\//i, '../');
      },
    },
  },
};

// 出力先のHTMLファイルを削除
if (process.env.NODE_ENV !== 'production') {
  glob.sync(`${dist}/**/*.html`).forEach((file) => {
    fs.unlinkSync(file);
  });
}

// テンプレートファイルをコンパイルする関数
const compileTemplate = (templatePath, data, options) => {
  const template = fs.readFileSync(templatePath, 'utf8');
  const compiledTemplate = ejs.render(template, data, options);

  // スペースやインデント起因の表示バグ等を回避のためフォーマットする
  const jsBeautifyOption = JSON.parse(fs.readFileSync('.ejsbrc.json', 'utf8'));
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
const files = glob.sync(`${config.dir.ejs}/**/!(_)*.ejs`);
files.forEach((file) => {
  // テンプレートをコンパイルする
  const compiledTemplate = compileTemplate(file, config.ejsData, config.ejsOptions);

  // コンパイルされたHTMLを出力する
  const HTMLFolder = config.isHTMLDir ? `${dist}/html/` : `${dist}/`;
  const distPath = file.replace(config.dir.ejs, HTMLFolder).replace('.ejs', '.html');
  ensureDirectoryExistence(path.dirname(distPath));
  fs.writeFileSync(distPath, compiledTemplate);
  console.log(`\x1b[36;1m${file} -> ${distPath.replace('./', '')} ...\x1b[0m`);
});
