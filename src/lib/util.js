const requireFromWorkingDirectory = require('../lib/require-cwd');
const { expandCrawlResult } = require("reffy");

async function loadCrawlResults(edCrawlResultsPath, trCrawlResultsPath) {
  let edCrawlResults, trCrawlResults;
  try {
    edCrawlResults = requireFromWorkingDirectory(edCrawlResultsPath);
  } catch(e) {
    throw "Impossible to read " + edCrawlResultsPath + ": " + e;
  }
  edCrawlResults = await expandCrawlResult(edCrawlResults, edCrawlResultsPath.replace(/index\.json$/, ''));

  if (trCrawlResultsPath) {
    try {
      trCrawlResults = requireFromWorkingDirectory(trCrawlResultsPath);
    } catch(e) {
      throw "Impossible to read " + trCrawlResultsPath + ": " + e;
    }
    trCrawlResults = await expandCrawlResult(trCrawlResults, trCrawlResultsPath.replace(/index\.json$/, ''));
  }

  return {
    ed: edCrawlResults.results,
    tr: trCrawlResults?.results
  };
}

/**************************************************
Export methods for use as module
**************************************************/
module.exports = { loadCrawlResults };
