/**
 * Tests the links analysis library.
 */
import { describe, it } from 'node:test';

import study from '../src/lib/study-refs.js';
import { assertNbAnomalies, assertAnomaly } from './util.js';

const specEdUrl = 'https://w3c.github.io/spec/';
const specEdUrl2 = 'https://w3c.github.io/spec2/';
const specEdUrl3 = 'https://w3c.github.io/spec3/';

function toRefs (name, url) {
  return [ {name, url} ];
}

const toTr = url => url.replace(
  'https://w3c.github.io',
  'https://www.w3.org/TR');

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
    release: {
      url: toTr(url)
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

describe('The references analyser', () => {
  it('reports no anomaly if references are not discontinued', () => {
    const crawlResult = toEdCrawlResults();
    const report = study(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('reports a discontinued reference with a replacement', () => {
    const crawlResult = toEdCrawlResults("discontinued", ["spec3"]);
    const report = study(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'discontinuedReferences',
      message: /spec3/,
      spec: { url: specEdUrl }
    });
  });

  it('reports a discontinued reference without a replacement', () => {
    const crawlResult = toEdCrawlResults("discontinued");
    const report = study(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'discontinuedReferences',
      message: /no known replacement/,
      spec: { url: specEdUrl }
    });
  });

  it('reports a missing reference', () => {
    const spec = populateSpec(specEdUrl);
    spec.links = { rawlinks: {} };
    spec.links.rawlinks[specEdUrl2] = {};
    const crawlResult = [spec];
    const report = study(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'missingReferences',
      message: specEdUrl2,
      spec: { url: specEdUrl }
    });
  });

  it('reports an inconsistent reference', () => {
    const spec = populateSpec(specEdUrl, toRefs('spec2', toTr(specEdUrl2)));
    spec.links = { rawlinks: {} };
    spec.links.rawlinks[specEdUrl2] = {};
    const spec2 = populateSpec(specEdUrl2);
    spec2.versions = [toTr(specEdUrl2)];
    const crawlResult = [spec, spec2];
    const report = study(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'inconsistentReferences',
      message: `${specEdUrl2}, related reference "spec2" uses URL ${toTr(specEdUrl2)}`,
      spec: { url: specEdUrl }
    });
  });
});
