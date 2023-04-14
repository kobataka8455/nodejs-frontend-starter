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

// chokidarを使って監視する
const watcher = chokidar.watch(targets, {
  ignored: /(^|[\\/])\../, // ignore dotfiles
  persistent: true,
});

const remove = async (type, path) => {
  let targetPath = path.replace('src', dist);

  // distの拡張子に変換
  if (type === 'scss') {
    targetPath = targetPath.replace('/scss/', '/css/').replace('.scss', '.css');
  } else if (type === 'ejs') {
    const htmlFolder = isHTMLDir ? '/html/' : '/';
    targetPath = targetPath.replace('/ejs/', htmlFolder).replace('.ejs', '.html');
  }

  // distに対象のファイル/フォルダがあれば削除
  if (await fs.stat(targetPath).then((stats) => stats.isDirectory())) {
    await fs.rm(targetPath, { recursive: true, force: true });
  } else if (
    await fs
      .access(targetPath)
      .then(() => true)
      .catch(() => false)
  ) {
    await fs.unlink(targetPath);
  }
};

const action = (type, path) => {
  exec(`npm run build:${type} "${path}"`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    if (stdout) {
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
const main = (event, path) => {
  // const color = event === 'add' ? '\x1b[32;1m' : event === 'change' ? '\x1b[36;1m' : '\x1b[31;1m';
  let type = path.split('.').pop();

  // フォルダパスの場合
  if (path.includes('/scss/')) {
    type = 'scss';
  } else if (path.includes('/ejs/')) {
    type = 'ejs';
  }

  // console.log(`${color}${path} has been ${event}\x1b[0m`);
  if (event === 'unlink' || event === 'unlinkDir') {
    remove(type, path).catch(console.error);
  } else {
    action(type, path);
  }
};

watcher.on('ready', () => {
  watcher.on('add', (path) => main('add', path));
});
watcher.on('change', (path) => main('change', path));
watcher.on('unlink', (path) => main('unlink', path));
watcher.on('unlinkDir', (path) => main('unlinkDir', path));
