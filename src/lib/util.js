const requireFromWorkingDirectory = require('../lib/require-cwd');
const { expandCrawlResult } = require('reffy');

async function loadCrawlResults (edCrawlResultsPath, trCrawlResultsPath) {
  let edCrawlResults, trCrawlResults;
  try {
    edCrawlResults = requireFromWorkingDirectory(edCrawlResultsPath);
  } catch (e) {
    throw new Error('Impossible to read ' + edCrawlResultsPath + ': ' + e);
  }
  edCrawlResults = await expandCrawlResult(edCrawlResults, edCrawlResultsPath.replace(/index\.json$/, ''));

  if (trCrawlResultsPath) {
    try {
      trCrawlResults = requireFromWorkingDirectory(trCrawlResultsPath);
    } catch (e) {
      throw new Error('Impossible to read ' + trCrawlResultsPath + ': ' + e);
    }
    trCrawlResults = await expandCrawlResult(trCrawlResults, trCrawlResultsPath.replace(/index\.json$/, ''));
  }

  return {
    ed: edCrawlResults.results,
    tr: trCrawlResults?.results
  };
}

function recordCategorizedAnomaly (report, category, possibleAnomalies) {
  return function recordAnomaly (specs, name, message) {
    if (!specs) {
      throw new Error('Cannot record an anomaly without also recording an offending spec');
    }
    specs = Array.isArray(specs) ? specs : [specs];
    specs = [...new Set(specs)];
    if (!possibleAnomalies.includes(name)) {
      throw new Error(`Cannot record an anomaly with name "${name}"`);
    }
    report.push({ category, name, message, specs });
  };
}

/**************************************************
Export methods for use as module
**************************************************/
module.exports = { loadCrawlResults, recordCategorizedAnomaly };
