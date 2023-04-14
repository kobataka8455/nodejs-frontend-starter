import browserSync from 'browser-sync';
import chokidar from 'chokidar';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const dist = process.env.DIST;

// 設定
const config = {
  port: 8282,
  bsPort: 3000,
};

// コンテンツタイプの取得
const getContentType = (filePath) => {
  const extname = path.extname(filePath);
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpg';
    case '.wav':
      return 'audio/wav';
    default:
      return 'text/plain';
  }
};

// サーバーの設定
const server = http.createServer((req, res) => {
  const filePath = path.join(dist, req.url);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end(`File ${req.url} not found!`);
      } else {
        res.statusCode = 500;
        res.end(`Internal server error: ${err.code}`);
      }
    } else {
      if (stats.isDirectory()) {
        fs.readdir(filePath, (err, files) => {
          if (err) {
            res.statusCode = 500;
            res.end(`Internal server error: ${err.code}`);
          } else {
            const url = req.url.endsWith('/') ? req.url : `${req.url}/`;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(`<body>`);
            res.write(`<h1>Folder: ${req.url}</h1>`);
            res.write('<ul>');
            files.forEach((file) => {
              res.write(`<li><a href="${url}${file}">${file}</a></li>`);
            });
            res.write('</ul>');
            res.write(`</body>`);
            res.end();
          }
        });
      } else {
        const stream = fs.createReadStream(filePath);
        stream.on('open', () => {
          res.setHeader('Content-Type', getContentType(filePath));
          stream.pipe(res);
        });
        stream.on('error', (err) => {
          res.setHeader('Content-Type', 'text/html');
          res.statusCode = 500;
          res.end(`Internal server error: ${err.code}`);
        });
      }
    }
  });
});

// ポートが既に使われている場合は、他のポートを自動で設定
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${config.bsPort} is already in use. Trying another port...`);
    config.bsPort++;
    server.listen(config.bsPort);
  }
});

// braowser-syncのインスタンス作成
const bs = browserSync.create();

// サーバーの起動
server.listen(config.bsPort, () => {
  console.log(`Server running at http://localhost:${config.bsPort}`);
  // braowser-syncの起動
  bs.init({
    proxy: `http://localhost:${config.bsPort}`,
    port: config.port,
    open: true,
    ui: false,
  });
});

// ファイルの変更を検知してブラウザをリロードする
chokidar.watch(`${dist}/**/*`).on('all', () => {
  bs.reload();
});
