import path from 'path';
import fs from 'fs';
const dist = path.resolve(process.cwd(), 'dist');
fs.promises.rm(dist, { recursive: true, force: true });
