import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const dist = process.env.DIST;
fs.promises.rm(dist, { recursive: true, force: true });
