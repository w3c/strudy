import assert from 'node:assert/strict';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptPath, '..');
const execOptions = { cwd: root };

async function strudy(params) {
  const exec = promisify(execCb);
  const cmd = `node --disable-warning=ExperimentalWarning strudy.js ${params}`;
  try {
    const { stdout, stderr } = await exec(cmd, execOptions);
    return { stdout, stderr };
  }
  catch (err) {
    const { stdout, stderr } = err;
    return { stdout, stderr };
  }
}

describe(`Strudy's CLI`, function () {
  this.slow(5000);
  this.timeout(10000);

  it('reports usage help when asked', async function () {
    const { stdout, stderr } = await strudy(`--help`);
    assert.match(stdout, /^Usage: strudy \[options\] \[command\]/);
    assert.deepEqual(stderr, '');
  });

  describe(`The "inspect" command`, function () {
    it('expects a crawl report as argument', async function () {
      const { stdout, stderr } = await strudy(`inspect`);
      assert.match(stderr, /error: missing required argument 'crawl'/);
      assert.deepEqual(stdout, '');
    });

    it('reports an error when provided crawl report does not exist', async function () {
      const { stdout, stderr } = await strudy(`inspect notareport`);
      assert.match(stderr, /Could not find/);
      assert.deepEqual(stdout, '');
    });

    it('reports an error when provided issues folder does not exist', async function () {
      const { stdout, stderr } = await strudy(`inspect test/data/empty.json --issues notafolder`);
      assert.match(stderr, /Could not find\/access the folder to store anomalies/);
      assert.deepEqual(stdout, '');
    });

    it('refuses formats other than "json" or "markdown"', async function () {
      const { stdout, stderr } = await strudy(`inspect test/data/empty.json --format html`);
      assert.match(stderr, /Unsupported --format option/);
      assert.deepEqual(stdout, '');
    });

    it('rejects incompatible format and issues options', async function () {
      const { stdout, stderr } = await strudy(`inspect test/data/empty.json --format json --issues issues`);
      assert.match(stderr, /The --format option can only be set to "markdown" when --issues is used/);
      assert.deepEqual(stdout, '');
    });

    it('reports an error when update-mode is set but not the issues option', async function () {
      const { stdout, stderr } = await strudy(`inspect test/data/empty.json --update-mode all`);
      assert.match(stderr, /The --update-mode option can only be set when --issues is set/);
      assert.deepEqual(stdout, '');
    });

    it('reports an error when update-mode is set to some unknown mode', async function () {
      const { stdout, stderr } = await strudy(`inspect test/data/empty.json --issues issues --update-mode notamode`);
      assert.match(stderr, /Unsupported --update-mode option/);
      assert.deepEqual(stdout, '');
    });
  });
});