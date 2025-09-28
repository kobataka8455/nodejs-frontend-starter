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
const isMinify: boolean = JSON.parse(process.env.MINIFY || 'false');
const isHTMLDir: boolean = JSON.parse(process.env.IS_HTML_DIR || 'false'); // dist/配下にHTMLフォルダを作成するかどうか
const dist: string = process.env.DIST || 'dist';
const ejsPath: string = process.env.EJS_PATH || 'src/ejs';
const HTMLFolder = isHTMLDir ? `${dist}/html/` : `${dist}/`;
const argTargetFile: string | undefined = process.env.TARGET_FILE;

// 設定
const config = {
  dir: {
    ejs: ejsPath, // EJSファイルのディレクトリ
  },
  ejsOptions: {
    root: `${path.resolve(process.cwd(), ejsPath)}`,
    filename: '',
  },
  ejsData: {
    path: {
      ejs: '/',
      comp: '/components', // コンポーネントのパス（src/ejs/をrootとしたルート絶対パス）
      static: '',
    },
    files: glob.sync(`${ejsPath}**/!(_)*.ejs`),
    func: {
      fnc01: () => "return fnc01",
      fnc02: () => "return fnc02"
    },
  },
};

// 出力先のHTMLファイルを削除
if (process.env.NODE_ENV !== 'production' && !argTargetFile) {
  glob.sync(`${HTMLFolder}**/*.html`).forEach((file: string) => {
    fs.unlinkSync(file);
  });
}

// EJSファイルをコンパイルする関数
interface EJSData {
  path: {
    ejs: string;
    comp: string;
    static: string;
  };
  files: string[];
  func: {
    fnc01: () => string;
    fnc02: () => string;
  };
}

interface EJSOptions {
  root: string;
  filename: string;
}

const compileTemplate = async (templatePath: string, data: EJSData, options: EJSOptions): Promise<string> => {
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
const files: string[] = argTargetFile ? new Array(argTargetFile) : glob.sync(`${config.dir.ejs}/**/!(_)*.ejs`);
files.forEach(async (file: string) => {
  // EJSファイルのinclude相対パスを設定する
  config.ejsOptions.filename = file;
  // 静的ファイルへの相対パス設定
  const relativePath = path.relative(config.dir.ejs, file);
  const regex = /[\/]/g;
  // 相対パス
  const outputRelativePath = (): string => {
    const distLevel = isHTMLDir ? 1 : 0;
    const slashCount = (relativePath.match(regex) ? relativePath.match(regex)!.length : 0) + distLevel;
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

  console.log(`\x1b[36;1m${file} -> ${distPath.replace('./', '')} ...\x1b[0m`);
});