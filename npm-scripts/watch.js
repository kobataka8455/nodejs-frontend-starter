import path from 'path';
import fs from 'fs/promises';
import chokidar from 'chokidar';
import { exec } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const dist = process.env.DIST;
const isHTMLDir = JSON.parse(process.env.IS_HTML_DIR); // dist/配下にHTMLフォルダを作成するかどうか

// 監視対象のフォルダとファイルを指定
const targets = 'src/**/*';

// chokidarの設定
const watcher = chokidar.watch(targets, {
  ignored: /(^|[\\/])\../, // ignore dotfiles
  persistent: true,
});

const remove = async (type, filePath) => {
  let targetPath = filePath.replace('src', dist);

  // distの拡張子に変換
  if (type === 'scss') {
    targetPath = targetPath.replace('/scss/', '/css/').replace('.scss', '.css');
  } else if (type === 'ejs') {
    const htmlFolder = isHTMLDir ? '/html/' : '/';
    targetPath = targetPath.replace('/ejs/', htmlFolder).replace('.ejs', '.html');
  }

  // distに対象のファイル/フォルダがあれば削除
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else if (stats.isFile()) {
      await fs.unlink(targetPath);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const action = (type, filePath) => {
  // filePathがある場合はファイル単体で起動
  exec(`${filePath ? `cross-env TARGET_FILE="${filePath}" ` : ''}npm run build:${type}`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    // jsファイル(rollup)の場合は結果がstderrに出力されるので
    if (stdout && type !== 'js') {
      console.error(stdout);
      return;
    }
    if (stderr) {
      console.error(stderr);
      return;
    }
  });
};

// 引数で受け取ったeventに応じて処理を分ける
const main = (event, filePath) => {
  // ターミナルのカラー設定
  const color = event === 'add' ? '\x1b[32;1m' : event === 'change' ? '\x1b[36;1m' : '\x1b[31;1m';
  let type = filePath.split('.').pop();

  /* 
   ** partialファイルの場合は
   ** 全ファイルを更新するためのフラグ設定
   **
   ** partialファイル以外は単体で更新する
   */
  const fileName = path.basename(filePath);
  let isAll = false;

  // フォルダパスで種別を判別
  if (filePath.includes('/scss/')) {
    type = 'scss';
    isAll = fileName.startsWith('_'); // partialファイル判定
  } else if (filePath.includes('/ejs/')) {
    type = 'ejs';
    isAll = fileName.startsWith('_'); // partialファイル判定
  } else if (filePath.includes('/scripts/')) {
    type = 'js';
    isAll = fileName.startsWith('_'); // partialファイル判定
  } else if (filePath.includes('/images/')) {
    type = 'image';
  } else if (filePath.includes('/icon-font/svg/')) {
    type = 'icon';
  }

  if (event === 'unlink' || event === 'unlinkDir') {
    remove(type, filePath).catch(console.error);
    console.log(`${color}${filePath} has been ${event}\x1b[0m`);

    // iconの場合は削除後に再コンパイルが必要
    if (type === 'icon') {
      action(type);
    }
  } else {
    if (isAll) {
      action(type);
    } else {
      action(type, filePath);
    }
  }
};

watcher.on('ready', () => {
  watcher.on('add', (filePath) => main('add', filePath));
});

// cmd + s 等を連打すると、changeイベントが複数回発火してしまうので、タイマーで制御
let timer;
watcher.on('change', (filePath) => {
  clearTimeout(timer);
  timer = setTimeout(() => main('change', filePath), 500);
});
watcher.on('unlink', (filePath) => main('unlink', filePath));
watcher.on('unlinkDir', (filePath) => main('unlinkDir', filePath));
