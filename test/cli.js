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

  it('reports usage help when asked', async function () {
    const { stdout, stderr } = await strudy(`--help`);
    assert.match(stdout, /^Usage: strudy \[options\] <report>/);
    assert.deepEqual(stderr, '');
  });

  it('expects a report argument', async function () {
    const { stdout, stderr } = await strudy(``);
    assert.match(stderr, /error: missing required argument 'report'/);
    assert.deepEqual(stdout, '');
  });

  it('reports an error when provided report does not exist', async function () {
    const { stdout, stderr } = await strudy(`notareport`);
    assert.match(stderr, /Could not find/);
    assert.deepEqual(stdout, '');
  });
});