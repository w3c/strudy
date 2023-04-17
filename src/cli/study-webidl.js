#!/usr/bin/env node

const { loadCrawlResults } = require('../lib/util');
const { studyWebIdl } = require('../lib/study-webidl');
const requireFromWorkingDirectory = require('../lib/require-cwd');
const { expandCrawlResult } = require("reffy");
const path = require("path");


function reportToConsole(results) {
  results.forEach(anomaly => anomaly.specs = anomaly.specs.map(spec => {
    return { shortname: spec.shortname, url: spec.url };
  }));
  console.log(JSON.stringify(results, null, 2));
}

async function main(crawlPath) {
  // Target the index file if needed
  if (!crawlPath.endsWith('index.json')) {
    crawlPath = path.join(crawlPath, 'index.json');
  }

  let crawl;
  try {
    crawl = requireFromWorkingDirectory(crawlPath);
  }
  catch(e) {
    throw "Impossible to read " + crawlPath + ": " + e;
  }

  const expanded = await expandCrawlResult(crawl, crawlPath.replace(/index\.json$/, ''), 'idl');
  const report = studyWebIdl(expanded.results);
  reportToConsole(report);
}

/**************************************************
Code run if the code is run as a stand-alone module
**************************************************/
if (require.main === module) {
  const crawlPath = process.argv[2];
  
  if (!crawlPath) {
    console.error('Web IDL analyzer must be called with a paths to crawl results as first parameter');
    process.exit(2);
  }

  main(crawlPath).catch(e => {
    console.error(e);
    process.exit(3);
  });
}
