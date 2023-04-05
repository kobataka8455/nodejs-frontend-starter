const chokidar = require('chokidar');
const { exec } = require('child_process');
const fs = require('fs');

// 監視対象のフォルダとファイルを指定
const targets = 'src/**/*';

// chokidarを使って監視する
const watcher = chokidar.watch(targets, {
  ignored: /(^|[\\/])\../, // ignore dotfiles
  persistent: true,
});

const remove = (type, path) => {
  let targetPath = path.replace('src', 'dist');

  // distの拡張子に変換
  if (type === 'scss') {
    targetPath = targetPath.replace('/scss/', '/css/').replace('.scss', '.css');
  } else if (type === 'ejs') {
    targetPath = targetPath.replace('/ejs/', '/').replace('.ejs', '.html');
  }

  // distに対象のファイル/フォルダがあれば削除
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      fs.promises.rm(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
  }
};
const action = (type) => {
  exec(`npm run build:${type}`, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

// 引数で受け取ったeventに応じて処理を分ける
const main = (event, path) => {
  const color = event === 'add' ? '\x1b[32;1m' : event === 'change' ? '\x1b[36;1m' : '\x1b[31;1m';
  let type = path.split('.').pop();

  // フォルダパスの場合
  if (path.includes('/scss/')) {
    type = 'scss';
  } else if (path.includes('/ejs/')) {
    type = 'ejs';
  }

  console.log(`${color}${path} has been ${event}\x1b[0m`);
  if (event === 'unlink' || event === 'unlinkDir') {
    remove(type, path);
  } else {
    action(type);
  }
};

watcher.on('ready', () => {
  watcher.on('add', (path) => main('add', path));
});
watcher.on('change', (path) => main('change', path));
watcher.on('unlink', (path) => main('unlink', path));
watcher.on('unlinkDir', (path) => main('unlinkDir', path));
