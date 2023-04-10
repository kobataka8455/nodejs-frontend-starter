import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import svgtofont from 'svgtofont';
import CleanCSS from 'clean-css';
import { ensureDirectoryExistence } from './create-directory.js';
const normalizeCSS = fs.readFileSync('./node_modules/normalize.css/normalize.css', 'utf-8');

const FONT_NAME = 'icons';
const SRC_DIR = 'src/icon-font/';
const SCSS_DIR = 'src/scss/icon-font/';
const OUTPUT_DIR = 'dist/icon-font/';
const PREVIEW_DIR = 'dist/icon-font/';

svgtofont({
  src: path.resolve(SRC_DIR, 'svg'), // svg path
  dist: OUTPUT_DIR, // output path
  styleTemplates: path.resolve(SRC_DIR, 'templates'),
  fontName: FONT_NAME, // font name
  classNamePrefix: `${FONT_NAME}-`,
  css: {
    output: path.join(SCSS_DIR), // css file path
  }, // Create CSS files.
}).then(() => {
  // 不要なsvgファイルを削除
  fs.promises.rm(path.join(OUTPUT_DIR, `${FONT_NAME}.svg`));
  fs.promises.rm(path.join(OUTPUT_DIR, `${FONT_NAME}.symbol.svg`));
  console.log('done!');
});
