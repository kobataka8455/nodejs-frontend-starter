import fs from 'fs';
import { glob } from 'glob';
import { HTMLHint } from 'htmlhint';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';
import { execSync } from 'child_process';
const lintType = process.env.LINT;
const targetFile = process.env.TARGET_FILE;

// HTMLHint
const HTMLHintFunc = async () => {
  console.log(`Starting '\x1b[36mlint:${lintType}\x1b[0m'`);
  const HTMLHintConfig = JSON.parse(fs.readFileSync('.htmlhintrc', 'utf8'));
  const allEjs = glob.sync('./src/ejs/**/*.ejs', { ignore: '' });
  allEjs.sort().forEach((ejsFile) => {
    const htmlContent = fs.readFileSync(ejsFile, 'utf8');
    const results = HTMLHint.verify(htmlContent, HTMLHintConfig);
    if (results.length > 0) {
      let message = '\n';
      message += `\x1b[4m${ejsFile}\x1b[0m\n`;
      message += `Found ${results.length} HTML syntax issues.\n`;
      results.forEach((result) => {
        const colorSet = (type) => {
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
  execSync(`js-beautify --config .ejsbrc.json -html "./src/ejs/**/*.ejs"`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    if (stdout) {
      console.error(stdout);
      return;
    }
    if (stderr) {
      console.error(stderr);
      return;
    }
  });
  console.log(`Finished '\x1b[36mlint:${lintType}\x1b[0m'`);
};

// Stylelint
const StylelintFunc = async () => {
  console.log(`Starting '\x1b[36mlint:${lintType}\x1b[0m'`);
  const StylelintConfig = JSON.parse(fs.readFileSync('.stylelintrc', 'utf8'));
  stylelint
    .lint({
      config: StylelintConfig,
      files: ['./src/scss/**/*.scss'],
      customSyntax: 'postcss-scss',
      quiet: true,
      formatters: 'string',
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

// eslint
const eslintFunc = async () => {
  console.log(`Starting '\x1b[36mlint:${process.env.LINT}\x1b[0m'`);
  // prettier --write \"\"
  const allJs = targetFile ? new Array(targetFile) : glob.sync('./src/scripts/**/*.js', { ignore: '' });
  allJs.sort().forEach((jsFile) => {
    const eslintCli = new ESLint({ overrideConfigFile: '.eslintrc' });
    const report = eslintCli.lintFiles(jsFile);

    report.then((result) => {
      if (result[0].errorCount || result[0].warningCount) {
        console.log(result[0].filePath);
        result[0].messages.forEach((message) => {
          console.log(`\x1b[31;1m[L${message.line}:C${message.column}]: ${message.message} (${message.ruleId})\x1b[0m`);
        });
        console.log(`\n\x1b[31;1m${result[0].errorCount} error, ${result[0].warningCount} warning\x1b[0m\n`);
      }
    });
  });

  // format
  execSync(`prettier --write "./src/scripts/**/*.js"`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    if (stdout) {
      console.error(stdout);
      return;
    }
    if (stderr) {
      console.error(stderr);
      return;
    }
  });
  console.log(`Finished '\x1b[36mlint:${process.env.LINT}\x1b[0m'`);
};

const main = async () => {
  lintType === 'ejs' && (await HTMLHintFunc());
  lintType === 'scss' && (await StylelintFunc());
  lintType === 'js' && (await eslintFunc());
};

main();
