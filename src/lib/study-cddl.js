/**
 * Analyze the CDDL extracted during a crawl and create an anomalies report.
 *
 * The CDDL parser surrenders as soon as it encounters an error. As such, the
 * anomalies report will contain at most one anomaly per CDDL module, even
 * though there may be many more problems with the CDDL.
 *
 * Note: for specs that define multiple CDDL modules, anomalies will also be
 * reported for the "all" module. That may appear as duplicating the errors,
 * but will be useful to detect rules that get defined with the same name in
 * two different modules (once the CDDL parser actually detects that).
 *
 * The analysis makes no attempt for now at assembling CDDL modules that
 * are part of the same namespace. For that to become possible, the recipe to
 * follow to create the namespaces out of modules will have to be specified
 * somehow.
 */

import { loadPyodide } from 'pyodide';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from "node:url";

const scriptPath = path.dirname(fileURLToPath(import.meta.url));

// Python WebAssembly environment (initialized once)
let pyodide = null;

async function studyCddl (specs, { crawledResults = [] } = {}) {
  const report = []; // List of anomalies to report

  // Setup Python WebAssembly environment
  if (!pyodide) {
    pyodide = await loadPyodide();

    // Retrieve the version of the cddlparser package to install from
    // the "requirements.txt" file at the root of the project
    const file = path.join(scriptPath, '..', '..', 'requirements.txt');
    const contents = await fs.readFile(file, 'utf8');
    const version = contents.match(/^cddlparser==(.*)/m)[1];

    // Load micropip to "install" the cddlparser package.
    // An alternative would be to `loadPackage` cddlparser from a Wheel URL
    // directly to avoid having to install micropip. The Wheel URL in Pypi does
    // not seem predictable. But the one for GitHub releases could work, e.g.:
    // https://github.com/tidoust/cddlparser/releases/download/v0.4.0/cddlparser-0.4.0-py3-none-any.whl
    // This would make loading slightly faster and avoid introducing yet
    // another dependency. But it would hardcode the cddlparser repository name
    // whereas the project could perhaps be moved in the future.
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');
    await micropip.install(`cddlparser==${version}`);
  }

  // Python will report execution results to the standard output
  let stdout = '';
  pyodide.setStdout({
    batched: str => stdout += str + '\n'
  });

  for (const spec of specs) {
    for (const cddlModule of (spec.cddl ?? [])) {
      stdout = '';
      await pyodide.runPythonAsync(`
from cddlparser import parse
try:
  parse('''${cddlModule.cddl}''')
except Exception as err:
  print(err)
      `);
      stdout = stdout.trim();

      // If nothing was reported, that means parsing succeeded, CDDL is valid
      if (!stdout) {
        continue;
      }

      let message = cddlModule.name ?
        `In the "${cddlModule.name}" module, ` :
        '';
      message += stdout;

      // The parser reports the line number at which the error occurred... but
      // it gets run against the expanded extract, and expansion drops the
      // header that Reffy adds to the extracts to note the provenance. The line
      // number is off by 5 as a result. Let's fix that. It's certainly not
      // fantastic to hardcode the number of lines that compose the header, but
      // let's say that's good enough for now!
      const reLineNumber = / line (\d+):/;
      const match = message.match(reLineNumber);
      if (match) {
        let lineNumber = parseInt(match[1], 10);
        lineNumber += 5;
        message = message.replace(reLineNumber, ` line ${lineNumber}:`);
      }
      
      report.push({
        name: 'invalidCddl',
        message,
        spec
      });
    }
  }
  return report;
}

export default studyCddl;
