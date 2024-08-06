import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import _ from 'lodash';
import svgicons2svgfont from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import nunjucks from 'nunjucks';
import crypto from 'crypto';
import prettier from 'prettier';
import { ensureDirectoryExistence } from './create-directory.js';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const dist = process.env.DIST;

// ファイル読み込み
const normalizeCss = fs.readFileSync('./node_modules/normalize.css/normalize.css').toString();
const prettierConfig = JSON.parse(fs.readFileSync('./.prettierrc', 'utf8'));

// 設定
const config = {
  fontName: 'my-icon',
  fontClassName: 'my-icon',
  cssFontPath: '../icon-font/', // cssフォルダからフォントフォルダまでの相対パス
  startUnicode: 0xf000, // nullにした場合は0xf000から始まる
  formats: ['ttf', 'eot', 'woff', 'woff2'], // 生成するフォントファイルの形式['ttf', 'eot', 'woff', 'woff2']
  template: {
    scss: `src/icon-font/templates/_icon-scss.njk`,
    html: `src/icon-font/templates/_icon-html.njk`,
  },
  output: {
    scss: `src/scss/icon-font/_icon-font.scss`,
    html: `${dist}/icon-font/index.html`,
  },
  dir: {
    svg: `src/icon-font/svg`,
    distFont: `${dist}/icon-font/`,
  },
  isHTML: process.env.NODE_ENV !== 'production', // 一覧のHTMLを生成するかどうか
  prependUnicode: false, // svgファイル名の先頭にUnicodeを付与するかどうか
  addHashInFontUrl: false, // フォントファイルのURLにハッシュを付与するかどうか
};

// SVGファイルのパスを取得する関数
const getSvgFiles = () => {
  const files = glob.sync(`${config.dir.svg}/**/*.svg`);
  return _.sortBy(files, (file) => {
    // ファイル名の先頭にUnicodeが付いている場合はUnicodeを返す
    const match = file.match(/\/u([a-fA-F0-9]{4})-/);
    if (match) {
      return parseInt(match[1], 16);
    }
    // Unicodeが付いていない場合はファイル名をそのまま返す
    return file;
  });
};

// ファイルを生成する関数
const generateFiles = async () => {
  const env = nunjucks.configure({ autoescape: false });
  const fontStream = new svgicons2svgfont({
    fontName: config.fontName,
    fontHeight: 1000,
    normalize: true,
  });

  let fontData = {
    svg: '',
    eot: '',
    ttf: '',
    woff: '',
    woff2: '',
  };
  let lastUnicode = config.startUnicode || 0xf000;

  fontStream.on('data', (data) => {
    fontData.svg += data;
  });
  fontStream.on('end', () => {
    // SVGファイルからTTFファイルを生成
    const ttf = svg2ttf(fontData.svg, {});
    if (config.formats.includes('ttf')) fontData.ttf = Buffer.from(ttf.buffer);

    // TTFファイルからEOTファイルを生成
    if (config.formats.includes('eot')) fontData.eot = Buffer.from(ttf2eot(ttf.buffer));

    // TTFファイルからWOFFファイルを生成
    if (config.formats.includes('woff')) fontData.woff = Buffer.from(ttf2woff(ttf.buffer));

    // TTFファイルからWOFF2ファイルを生成
    if (config.formats.includes('woff2')) fontData.woff2 = Buffer.from(ttf2woff2(ttf.buffer));

    const createFileOptions = {
      hash: config.addHashInFontUrl ? crypto.createHash('md5').update(fontData.svg).digest('hex') : '',
      fontName: config.fontName,
      fontPath: config.cssFontPath,
      className: config.fontClassName,
      glyphs: fontStream.glyphs,
      formats: config.formats,
      resetCSS: normalizeCss,
    };
    // SCSSを生成
    const scssContent = env.render(config.template.scss, createFileOptions);
    const formattedScssContent = prettier.format(scssContent, { parser: 'scss', ...prettierConfig });

    // HTMLを生成
    const htmlContent = env.render(config.template.html, createFileOptions);

    // フォントファイルを保存
    ensureDirectoryExistence(config.dir.distFont);
    if (config.formats.includes('ttf')) fs.writeFileSync(path.join(config.dir.distFont, `${config.fontName}.ttf`), fontData.ttf);
    if (config.formats.includes('eot')) fs.writeFileSync(path.join(config.dir.distFont, `${config.fontName}.eot`), fontData.eot);
    if (config.formats.includes('woff')) fs.writeFileSync(path.join(config.dir.distFont, `${config.fontName}.woff`), fontData.woff);
    if (config.formats.includes('woff2')) fs.writeFileSync(path.join(config.dir.distFont, `${config.fontName}.woff2`), fontData.woff2);
    fs.writeFileSync(config.output.scss, formattedScssContent);
    if (config.isHTML) fs.writeFileSync(config.output.html, htmlContent);

    console.log(`\x1b[36;1mWebfont generated for ${config.fontName}.\x1b[0m`);
  });

  // SVGファイルをストリームに流し込む
  getSvgFiles().forEach((file, idx) => {
    const glyph = fs.createReadStream(file);
    const basename = path.basename(file);
    const matches = basename.match(/^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/i);
    if (matches && matches[1]) {
      lastUnicode = parseInt(matches[1].replace(/u/g, ''), 16);
    } else {
      lastUnicode = idx === 0 ? lastUnicode : lastUnicode + 1;
      if (config.prependUnicode) {
        const outputPath = path.join(config.dir.svg, `u${String.fromCharCode(lastUnicode).codePointAt(0).toString(16).toUpperCase()}-${basename}`);
        fs.renameSync(file, outputPath, (err) => {
          console.log(err);
        });
        glyph.path = outputPath;
      }
    }
    glyph.metadata = {
      name: basename
        .replace(/(u[\dA-F]{4}-)/g, '')
        .replace(/\.svg$/i, '')
        .replace(/\s+/g, '-'),
      unicode: [String.fromCharCode(lastUnicode)],
    };
    fontStream.write(glyph);
  });

  fontStream.end();
};

generateFiles();
