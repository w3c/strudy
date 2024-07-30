#!/usr/bin/env node

import { loadCrawlResults } from '../lib/util.js';
import studyWebIdl from '../lib/study-webidl.js';
import loadJSON from '../lib/load-json.js';
import { expandCrawlResult } from 'reffy';
import path from 'node:path';


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

  const crawl = await loadJSON(crawlPath);
  if (!crawl) {
    throw new Error("Impossible to read " + crawlPath);
  }

  const expanded = await expandCrawlResult(crawl, crawlPath.replace(/index\.json$/, ''), 'idl');
  const report = studyWebIdl(expanded.results);
  reportToConsole(report);
}

/**************************************************
Main loop
**************************************************/
const crawlPath = process.argv[2];
if (!crawlPath) {
  console.error('Web IDL analyzer must be called with a paths to crawl results as first parameter');
  process.exit(2);
}
main(crawlPath).catch(e => {
  console.error(e);
  process.exit(3);
});
