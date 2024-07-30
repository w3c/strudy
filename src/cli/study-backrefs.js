#!/usr/bin/env node
/**
 * The backrefs analyzer takes links to a ED crawl folder and a TR crawl folder,
 * and creates a report that lists, for each spec:
 *
 * - Links to anchors that do not exist
 * - Links to anchors that no longer exist in the ED of the target spec
 * - Links to anchors that are not definitions or headings
 * - Links to definitions that are not exported
 * - Links to dated TR URLs
 * - Links to specs that should no longer be referenced
 * - Links to documents that look like specs but are unknown in Reffy
 *   (likely not an anomaly per se)
 *
 * It also flags links that look like specs but that do not appear in the crawl
 * (most of these should be false positives).
 *
 * The backrefs analyzer can be called directly through:
 *
 * `node study-backrefs.js [root crawl folder]`
 *
 * where `root crawl folder` is the path to the root folder that contains `ed`
 * and `tr` subfolders. Alternatively, the analyzer may be called with two
 * arguments, one being the path to the ED crawl folder, another being the path
 * to the TR crawl folder.
 *
 * @module backrefs
 */

import { loadCrawlResults } from '../lib/util.js';
import studyBackrefs from '../lib/study-backrefs.js';
import path from 'node:path';

function reportToConsole(results) {
  for (const anomaly of results) {
    anomaly.specs = anomaly.specs.map(spec => {
      return { shortname: spec.shortname, url: spec.url, title: spec.title };
    });
  }
  const perSpec = {};
  for (const anomaly of results) {
    for (const spec of anomaly.specs) {
      if (!perSpec[spec.url]) {
        perSpec[spec.url] = { spec, anomalies: [] };
      }
      perSpec[spec.url].anomalies.push(anomaly);
    }
  }

  const anomalyTypes = [
    { name: 'brokenLinks', title: 'Links to anchors that do not exist' },
    { name: 'evolvingLinks', title: 'Links to anchors that no longer exist in the editor draft of the target spec' },
    { name: 'notDfn', title: 'Links to anchors that are not definitions or headings' },
    { name: 'notExported', title: 'Links to definitions that are not exported' },
    { name: 'datedUrls', title: 'Links to dated TR URLs' },
    { name: 'outdatedSpecs', title: 'Links to specs that should no longer be referenced' },
    { name: 'unknownSpecs', title: 'Links to documents that are not recognized as specs' }
  ];
  let report = '';
  Object.keys(perSpec)
    .sort((url1, url2) => perSpec[url1].spec.title.localeCompare(perSpec[url2].spec.title))
    .forEach(url => {
      const spec = perSpec[url].spec;
      const anomalies = perSpec[url].anomalies;
      report += `<details><summary><a href="${url}">${spec.title}</a></summary>\n\n`;
      for (const type of anomalyTypes) {
        const links = anomalies
          .filter(anomaly => anomaly.name === type.name)
          .map(anomaly => anomaly.message);
        if (links.length > 0) {
          report += `${type.title}:\n`;
          for (const link of links) {
            report += `* ${link}\n`;
          }
          report += '\n\n';
        }
      }
      report += '</details>\n';
    });
  console.log(report);
}


/**************************************************
Main loop
**************************************************/
let edCrawlResultsPath = process.argv[2];
let trCrawlResultsPath = process.argv[3];

if (!edCrawlResultsPath) {
  console.error('Backrefs analyzer must be called with a paths to crawl results as first parameter');
  process.exit(2);
}

// If only one argument is provided, consider that it is the path to the
// root folder of a crawl results, with "ed" and "tr" subfolders
if (!trCrawlResultsPath) {
  trCrawlResultsPath = path.join(edCrawlResultsPath, 'tr');
  edCrawlResultsPath = path.join(edCrawlResultsPath, 'ed');
}

// Target the index file if needed
if (!edCrawlResultsPath.endsWith('index.json')) {
  edCrawlResultsPath = path.join(edCrawlResultsPath, 'index.json');
}
if (!trCrawlResultsPath.endsWith('index.json')) {
  trCrawlResultsPath = path.join(trCrawlResultsPath, 'index.json');
}

// Analyze the crawl results
loadCrawlResults(edCrawlResultsPath, trCrawlResultsPath)
  .then(async crawl => {
    // Donwload automatic map of multipages anchors in HTML spec
    let htmlFragments = {};
    try {
      htmlFragments = await fetch("https://html.spec.whatwg.org/multipage/fragment-links.json").then(r => r.json());
    } catch (err) {
      console.warn("Could not fetch HTML fragments data, may report false positive broken links on HTML spec", err);
    }
    return { crawl, htmlFragments };
  })
  .then(({ crawl, htmlFragments }) => studyBackrefs(crawl.ed, crawl.tr, htmlFragments))
  .then(reportToConsole)
  .catch(e => {
    console.error(e);
    process.exit(3);
  });
