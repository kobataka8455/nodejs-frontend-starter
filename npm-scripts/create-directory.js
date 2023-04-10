import path from 'path';
import fs from 'fs';

export const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(filePath)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(filePath);
};
