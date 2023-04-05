const path = require('path');
const fs = require('fs');
const dist = path.resolve(process.cwd(), 'dist');
fs.promises.rm(dist, { recursive: true, force: true });
