import fs from 'fs';
import { glob } from 'glob';
import { HTMLHint } from 'htmlhint';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}` });

const lintType: string | undefined = process.env.LINT;
const targetFile: string | undefined = process.env.TARGET_FILE;
const scriptsFolder: string = process.env.SCRIPTS_FOLDER || 'scripts';

interface HTMLHintResult {
  line: number;
  col: number;
  evidence: string;
  type: string;
  message: string;
  rule: {
    id: string;
  };
}

// HTMLHint
const HTMLHintFunc = async (): Promise<void> => {
  console.log(`Starting '\x1b[36mlint:${lintType}\x1b[0m'`);
  const HTMLHintConfig = JSON.parse(fs.readFileSync('.htmlhintrc', 'utf8'));
  const allEjs = glob.sync('./src/ejs/**/*.ejs', { ignore: '' });
  allEjs.sort().forEach((ejsFile: string) => {
    const htmlContent = fs.readFileSync(ejsFile, 'utf8');
    const results: HTMLHintResult[] = HTMLHint.verify(htmlContent, HTMLHintConfig);
    if (results.length > 0) {
      let message = '\n';
      message += `\x1b[4m${ejsFile}\x1b[0m\n`;
      message += `Found ${results.length} HTML syntax issues.\n`;
      results.forEach((result: HTMLHintResult) => {
        const colorSet = (type: string): string => {
          switch (type) {
            case 'error':
              return '\x1b[31;1m';
            case 'warning':
              return '\x1b[36;1m';
            default:
              return '\x1b[32;1m';
          }
        };
        const color = colorSet(result.type);
        message += `  ${color}[L${result.line}:C${result.col}] | ${result.evidence}\x1b[0m\n`;
        message += `  ${color}${result.type.toLocaleUpperCase()}:${result.message} (${result.rule.id})\x1b[0m\n\n`;
      });
      console.log(message);
    }
  });

  // format
  try {
    execSync(`js-beautify --config .ejsbrc.json -html "./src/ejs/**/*.ejs"`);
  } catch (error) {
    console.error('Format error:', error);
  }
  console.log(`Finished '\x1b[36mlint:${lintType}\x1b[0m'`);
};

// Stylelint
const StylelintFunc = async (): Promise<void> => {
  console.log(`Starting '\x1b[36mlint:${lintType}\x1b[0m'`);
  const StylelintConfig = JSON.parse(fs.readFileSync('.stylelintrc', 'utf8'));
  stylelint
    .lint({
      config: StylelintConfig,
      files: ['./src/scss/**/*.scss'],
      customSyntax: 'postcss-scss',
      quiet: true,
      formatter: 'string',
      fix: true,
    })
    .then((data) => {
      data.results.forEach((result) => {
        if (result.errored) {
          console.log(result.source);
          result.warnings.forEach((warning) => {
            console.log(`\x1b[31;1m[L${warning.line}:C${warning.column}]: ${warning.text}\x1b[0m\n`);
          });
        }
      });
      console.log(`Finished '\x1b[36mlint:${process.env.LINT}\x1b[0m'`);
    })
    .catch((err) => {
      console.log(err);
    });
};

interface ESLintResult {
  errorCount: number;
  warningCount: number;
  filePath: string;
  messages: Array<{
    line: number;
    column: number;
    message: string;
    ruleId: string | null;
  }>;
}

// eslint
const eslintFunc = async (): Promise<void> => {
  console.log(`Starting '\x1b[36mlint:${process.env.LINT}\x1b[0m'`);
  const allJs: string[] = targetFile ? new Array(targetFile) : glob.sync(`./src/${scriptsFolder}/**/*.{ts,js}`, { ignore: '' });
  allJs.sort().forEach((jsFile: string) => {
    const eslintCli = new ESLint({ overrideConfigFile: '.eslintrc' });
    const report = eslintCli.lintFiles(jsFile);

    report.then((result: ESLintResult[]) => {
      if (result[0].errorCount || result[0].warningCount) {
        console.log(result[0].filePath);
        result[0].messages.forEach((message) => {
          console.log(`\x1b[31;1m[L${message.line}:C${message.column}]: ${message.message} (${message.ruleId || 'no-rule'})\x1b[0m`);
        });
        console.log(`\n\x1b[31;1m${result[0].errorCount} error, ${result[0].warningCount} warning\x1b[0m\n`);
      }
    });
  });

  // format
  try {
    execSync(`prettier --write "./src/${scriptsFolder}/**/*.{ts,js}"`);
  } catch (error) {
    console.error('Format error:', error);
  }
  console.log(`Finished '\x1b[36mlint:${process.env.LINT}\x1b[0m'`);
};

const main = async (): Promise<void> => {
  if (lintType === 'ejs') await HTMLHintFunc();
  if (lintType === 'scss') await StylelintFunc();
  if (lintType === 'js') await eslintFunc();
};

main();