#!/usr/bin/env node

const { loadCrawlResults } = require('../lib/util');
const { studyAlgorithms } = require('../lib/study-algorithms');
const requireFromWorkingDirectory = require('../lib/require-cwd');
const { expandCrawlResult } = require("reffy");
const path = require("path");

function reportToConsole(results) {
  const toreport = [];
  for (const anomaly of results) {
    const spec = anomaly.specs[0];
    let entry = toreport.find(entry => entry.spec.shortname === spec.shortname);
    if (!entry) {
      entry = { spec, anomalies: [] };
      toreport.push(entry);
    }
    entry.anomalies.push(anomaly);
  }
  toreport.sort((entry1, entry2) => {
    return entry1.spec.title.localeCompare(entry2.spec.title);
  });
  for (const entry of toreport) {
    const spec = entry.spec;
    console.log(`- [${spec.title}](${spec.nightly?.url ?? spec.url})`);
    for (const anomaly of entry.anomalies) {
      console.log(`  - ${anomaly.message}`);
    }
  }
}

async function main(crawlPath, anomalyType) {
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

  const expanded = await expandCrawlResult(crawl, crawlPath.replace(/index\.json$/, ''), ['algorithms']);
  const report = studyAlgorithms(expanded.results);
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
