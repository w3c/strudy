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

import { parse } from 'cddlparser';

async function studyCddl (specs, { crawledResults = [] } = {}) {
  const report = []; // List of anomalies to report

  for (const spec of specs) {
    for (const cddlModule of (spec.cddl ?? [])) {
      try {
        parse(cddlModule.cddl);
      }
      catch (err) {
        // Format the error message, omitting the parser error name which does
        // not bring much and makes the message less readable.
        let message = cddlModule.name ?
          `In the "${cddlModule.name}" module, ` :
          '';
        message += err.toString().replace(/^ParserError: /, '');

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
  }
  return report;
}

export default studyCddl;
