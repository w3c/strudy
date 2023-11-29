/**
 * Tests the links analysis library.
 */
/* global describe, it */

const { studyReferences } = require('../src/lib/study-refs');
const { assertNbAnomalies, assertAnomaly } = require('./util');

const specEdUrl = 'https://w3c.github.io/spec/';
const specEdUrl2 = 'https://w3c.github.io/spec2/';
const specEdUrl3 = 'https://w3c.github.io/spec3/';

function toRefs (name, url) {
  return [ {name, url} ];
}


const populateSpec = (url, refs = [], standing = "good", obsoletedBy) => {
  const shortname = url.slice(0, -1).split('/').pop();
  return {
    url: url,
    refs: {
      normative: refs
    },
    nightly: {
      url
    },
    shortname,
    standing,
    obsoletedBy
  };
};

function toEdCrawlResults (standing = "good", replacements) {
  return  [
    populateSpec(specEdUrl, toRefs("spec2", specEdUrl2)),
    populateSpec(specEdUrl2, [], standing, replacements),
    populateSpec(specEdUrl3)
  ];
}

describe('The reference analyser', () => {
  it('reports no anomaly if references are not discontinued', () => {
    const crawlResult = toEdCrawlResults();
    const report = studyReferences(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('reports a discontinued reference with a replacement', () => {
    const crawlResult = toEdCrawlResults("discontinued", ["spec3"]);
    const report = studyReferences(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      category: 'refs',
      message: /spec3/
    });
  });

  it('reports a discontinued reference without a replacement', () => {
    const crawlResult = toEdCrawlResults("discontinued");
    const report = studyReferences(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      category: 'refs',
      message: /no known replacement/
    });
  });

});
