const path = require('path');
const { glob } = require('glob');

const targets = glob.sync(`${__dirname}/dist/**/*.html`);
const scenarios = targets.map((file) => {
  const label = file.replace(`${__dirname}/dist/`, '').replace(/\//g, '-').replace('.html', '');

  // ScenarioReference:https://github.com/garris/BackstopJS
  const scenario = {
    label: label,
    url: `/${path.relative(__dirname, file)}`,
    misMatchThreshold: 0.1, // recommendation:0.005
  };
  return scenario;
});

const setting = {
  id: 'backstop_default',
  viewports: [
    {
      label: 'phone',
      width: 375,
      height: 667,
    },
    {
      label: 'pc',
      width: 1280,
      height: 720,
    },
  ],
  onBeforeScript: 'puppet/onBefore.cjs',
  onReadyScript: 'puppet/onReady.cjs',
  scenarios: scenarios,
  paths: {
    bitmaps_reference: 'backstop_data/bitmaps_reference',
    bitmaps_test: 'backstop_data/bitmaps_test',
    engine_scripts: 'backstop_data/engine_scripts',
    html_report: 'backstop_data/html_report',
    ci_report: 'backstop_data/ci_report',
  },
  report: ['browser'],
  engine: 'puppeteer',
  engineOptions: {
    args: ['--no-sandbox'],
  },
  asyncCaptureLimit: 5,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false,
};

module.exports = setting;
