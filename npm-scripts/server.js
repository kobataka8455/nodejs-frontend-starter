const bs = require('browser-sync').create();
const http = require('http');
const path = require('path');
const fs = require('fs');
const distFolder = `${process.cwd()}/dist/`;

const port = 8282;
let bsPort = 3000;

// サーバーの設定
const server = http.createServer((req, res) => {
  // リクエストされたファイルのパスを作成
  const filePath = path.join(distFolder, req.url === '/' ? 'index.html' : req.url);

  // ファイルが存在する場合は返す
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.statusCode = 404;
      res.end('File not found');
    }
  });
});

// ポートが既に使われている場合は、他のポートを自動で設定
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${bsPort} is already in use. Trying another port...`);
    bsPort++;
    server.listen(bsPort);
  }
});

// サーバーの起動
server.listen(bsPort, () => {
  console.log(`Server running at http://localhost:${bsPort}`);
  // braowser-syncの起動
  bs.init({
    proxy: `http://localhost:${bsPort}`,
    port: port,
    open: true,
    ui: false,
  });
});

// ファイルの変更を検知してブラウザをリロードする
bs.watch(`${distFolder}/**/*`).on('change', bs.reload);
