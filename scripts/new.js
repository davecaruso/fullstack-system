/* eslint-disable no-console */
const cli = require('cli');
const log = require('../log');
const fs = require('fs-extra');
const path = require('path');
const unzip = require('unzipper');
const npmValid = require('validate-npm-package-name');
const npmRunScript = require('npm-run-script');

async function runSequence(promises) {
  for (const promise of promises) {
    try {
      await promise();
    } catch (error) {
      /* Quit */
      return;
    }
  }
}

runSequence([
  // Validate Project Name
  async () => {
    if (!cli.args[0]) {
      log.error('Missing Project Name');
      throw 0;
    }

    const validate = npmValid(cli.args[0]);

    if (!validate.validForNewPackages) {
      if (validate.errors) {
        validate.errors.forEach((x) => log.error('An npm package ' + x));
      }
      if (validate.warnings) {
        validate.warnings.forEach((x) => log.error('An npm package ' + x));
      }
      throw 0;
    }
  },
  // Create Folder
  async () => {
    log.info(`Creating new project "${cli.args[0]}"`);
    await fs.mkdirs(cli.args[0]);
  },
  // Unzip Template
  async () => {
    console.log(
      'Copying the ' + (cli.args[1] === 'typescript' ? 'TypeScript' : 'Starter') + ' Template...'
    );
    const templateZipName = cli.args[1] === 'typescript' ? 'typescript' : 'starter';
    const zip = path.join(__dirname, '../templates/' + templateZipName + '.zip');
    const out = path.join(process.cwd(), './' + cli.args[0]);

    await new Promise((resolve) => {
      const stream = fs.createReadStream(zip).pipe(unzip.Extract({ path: out }));
      stream.on('close', resolve);
    });
  },
  // Set package name in package.json
  async () => {
    process.chdir('./' + cli.args[0]);

    const json = await fs.readJSON('./package.json');

    json.name = cli.args[0];

    await fs.writeJSON('./package.json', json, { spaces: 2 });
  },
  // Run NPM Install
  () => {
    return new Promise((resolve, reject) => {
      const child = npmRunScript('npm i -D');
      child.once('error', (error) => {
        reject(error);
      });
      child.once('exit', () => {
        resolve();
      });
    });
  },
  // Say final message
  async () => {
    console.log('');
    console.log('DONE!');
    console.log('');
    console.log('Get started by running these commands:');
    console.log(` $ cd ${cli.args[0]}`);
    console.log(' $ npm start');
    console.log('');
  },
]);
