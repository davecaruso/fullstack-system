const path = require('path');

// eslint-disable-next-line no-underscore-dangle
const SYSTEM_DIR = path.join(__dirname, '../');
const SOURCE_DIR = process.cwd();
const delim = process.platform === 'win32' ? ';' : ':';
process.env.NODE_PATH += delim + SOURCE_DIR + '/node_modules/';
process.env.NODE_PATH += delim + SYSTEM_DIR + '/node_modules/';
// eslint-disable-next-line no-underscore-dangle
require('module').Module._initPaths();

const fs = require('fs-extra');
const log = require('../log');

process.env.NODE_GLOBAL_PORT = global.port;

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
} catch (error) {
  log.error("Cannot read project's package.json file. Does it exist?");
  return;
}

const root = (pkg['fullstack-system'] && pkg['fullstack-system'].root) || 'src';
const server = (pkg['fullstack-system'] && pkg['fullstack-system'].server) || 'server';

// Clear Temp
fs.removeSync(path.join(__dirname, '../.temp'));
fs.mkdirsSync(path.join(__dirname, '../.temp'));

// Generate Entry File
const SERVER_ENTRY = path.join(process.cwd(), root, server).replace(/\\/g, '\\\\');
const SERVER_NAME = pkg.name;

fs.writeFileSync(
  path.join(__dirname, '../.temp/webpack-server-entry.js'),
  fs
    .readFileSync(path.join(__dirname, '../server/server-entry.dev.js'))
    .toString()
    // Replace to make webpack happy!
    .replace(/'\{SERVER_ENTRY\}'/g, `'${SERVER_ENTRY}'`)
    .replace(/'\{SERVER_NAME\}'/g, `'${SERVER_NAME}'`)
);

// Webpack Watch It
const webpack = require('webpack');
const compiler = webpack(require('../config/server.webpack.config'));

let first = true;

compiler.watch(
  {
    aggregateTimeout: 200,
  },
  (err, stats) => {
    if (first) {
      first = false;
      return;
    }
    if (err) {
      log.server('Compiled with errors');
    } else {
      log.server('Compiled Successfully');
    }

    if (stats.compilation.warnings) {
      stats.compilation.warnings.forEach((warn) => {
        log.serverWarn(warn);
      });
    }
    if (stats.compilation.errors) {
      stats.compilation.errors.forEach((err) => {
        log.serverError(err);
      });
    }
  }
);
