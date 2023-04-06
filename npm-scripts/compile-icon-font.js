const webfont = require('webfont').default;
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const cleanCSS = require('clean-css');
const { ensureDirectoryExistence } = require('./create-directory');
const normalizeCSS = fs.readFileSync('./node_modules/normalize.css/normalize.css', 'utf-8');

const SVG_DIR = './src/icon-font/svg/';
const SCSS_DIR = './src/scss/icon-font/';
const OUTPUT_DIR = './dist/icon-font/';
const PREVIEW_DIR = './dist/icon-font/';
const FONT_NAME = 'icons';

// preview用のHTMLを生成する関数
function generatePreviewHtml(config, icons, resetCSS) {
  const template = fs.readFileSync('./src/icon-font/templates/_preview.ejs', 'utf8');
  const html = ejs.render(template, { config, icons, resetCSS });
  ensureDirectoryExistence(PREVIEW_DIR);
  fs.writeFileSync(path.join(PREVIEW_DIR, 'index.html'), html, 'utf8');
}

webfont({
  files: path.join(SVG_DIR, '*.svg'),
  fontName: FONT_NAME,
  templateClassName: FONT_NAME,
  formats: ['ttf', 'woff', 'woff2'],
  template: './src/icon-font/templates/_icons.scss',
  templateFontPath: `icon-font/`,
  startUnicode: 0xf001,
  dest: OUTPUT_DIR,
}).then((result) => {
  const { config, glyphsData } = result;

  // SCSSファイルを生成
  ensureDirectoryExistence(SCSS_DIR);
  fs.writeFileSync(path.join(SCSS_DIR, '_icons.scss'), result.template);

  // fontファイルを生成
  ensureDirectoryExistence(OUTPUT_DIR);
  config.formats.forEach((format) => {
    fs.writeFileSync(path.join(OUTPUT_DIR, `${FONT_NAME}.${format}`), result[format]);
  });

  // preview用のHTMLファイルを生成（開発環境のみ）
  if (process.env.NODE_ENV !== 'production') {
    generatePreviewHtml(
      config,
      glyphsData.map((glyph) => {
        return glyph;
      }),
      new cleanCSS({ level: 2 }).minify(normalizeCSS).styles
    );
  }

  console.log(`\x1b[36;1mWebfont generated for ${config.fontName}.\x1b[0m`);
});
