const path = require('path');
const fs = require('fs');

const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(filePath)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(filePath);
};

module.exports = {
  ensureDirectoryExistence,
};
