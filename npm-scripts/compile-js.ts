import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { build } from 'esbuild';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

// envから値を取得
const isMinify: boolean = JSON.parse(process.env.MINIFY || 'false');
const dist: string = process.env.DIST || 'dist';
const scriptsFolder: string = process.env.SCRIPTS_FOLDER || 'scripts';
const argTargetFile: string | undefined = process.env.TARGET_FILE;

// 出力先のJSファイルを削除
if (process.env.NODE_ENV !== 'production' && !argTargetFile) {
  const jsFiles = glob.sync(`${dist}/${scriptsFolder}/**/*.js`);
  jsFiles.forEach((file: string) => {
    fs.unlinkSync(file);
  });
}

// ビルド対象ファイルを取得
const files: string[] = argTargetFile ? [argTargetFile] : glob.sync(`src/${scriptsFolder}/**/!(_)*.{ts,js}`);

// 各ファイルをビルド
const buildFiles = async (): Promise<void> => {
  for (const file of files) {
    const outputPath = file.replace(`src/${scriptsFolder}`, `${dist}/${scriptsFolder}`).replace(/\.ts$/, '.js');
    
    // 出力ディレクトリを作成
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      await build({
        entryPoints: [file],
        outfile: outputPath,
        bundle: true,
        format: 'iife', // Rollupのformat: 'iife'と同等
        target: 'es2015', // esbuildがサポートする最小バージョン
        minify: isMinify,
        sourcemap: false,
        write: true,
      });
      
      console.log(`\x1b[36;1m${file} -> ${outputPath} ...\x1b[0m`);
    } catch (error) {
      console.error(`Build failed for ${file}:`, error);
    }
  }
};

buildFiles().catch(console.error);