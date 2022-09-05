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

const { loadCrawlResults, studyBackrefs } = require('../lib/study-backrefs');
const path = require("path");


function reportToConsole(results) {
  let report = "";
  Object.keys(results)
    .sort((r1, r2) => results[r1].title.localeCompare(results[r2].title))
    .forEach(s => {
      const result = results[s];
      report += `<details><summary><a href="${s}">${result.title}</a></summary>\n\n`;
      if (result.brokenLinks.length) {
        report += "Links to anchors that don't exist:\n"
        result.brokenLinks.forEach(l => {
          report += "* " + l + "\n";
        })
        report += "\n\n";
      }
      if (result.evolvingLinks.length) {
        report += "Links to anchors that no longer exist in the editor draft of the target spec:\n"
        result.evolvingLinks.forEach(l => {
          report += "* " + l + "\n";
        })
        report += "\n\n";
      }
      if (result.notDfn.length) {
        report += "Links to anchors that are not definitions or headings:\n"
        result.notDfn.forEach(l => {
          report += "* " + l + "\n";
        })
        report += "\n\n";
      }
      if (result.notExported.length) {
        report += "Links to definitions that are not exported:\n"
        result.notExported.forEach(l => {
          report += "* " + l + "\n";
        })
        report += "\n\n";
      }
      if (result.datedUrls.length) {
        report += "Links to dated TR URLs:\n"
        result.datedUrls.forEach(l => {
          report += "* " + l + "\n";
        })
        report += "\n\n";
      }
      if (result.outdatedSpecs.length) {
        report += "Links to specs that should no longer be referenced:\n"
        result.outdatedSpecs.forEach(l => {
          report += "* " + l + "\n";
        })
        report += "\n\n";
      }
      if (result.unknownSpecs.length) {
        report += "Links to things that look like specs but that aren't recognized as such in crawl data:\n"
        result.unknownSpecs.forEach(l => {
          report += "* " + l + "\n";
        })
        report += "\n\n";
      }
      report += "</details>\n";
    });
  console.log(report);
}


/**************************************************
Code run if the code is run as a stand-alone module
**************************************************/
if (require.main === module) {
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
    .then(crawl => studyBackrefs(crawl.ed, crawl.tr))
    .then(reportToConsole)
    .catch(e => {
      console.error(e);
      process.exit(3);
    });
}
