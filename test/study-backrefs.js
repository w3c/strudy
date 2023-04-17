/**
 * Tests the links analysis library.
 */
/* global describe, it */

const { studyBackrefs } = require('../src/lib/study-backrefs');
const { assertNbAnomalies, assertAnomaly } = require('./util');

const specEdUrl = 'https://w3c.github.io/spec/';
const specEdUrl2 = 'https://w3c.github.io/spec2/';

const toTr = url => url.replace('https://w3c.github.io', 'https://www.w3.org/TR');

const idsToDfns = (ids) => {
  return ids.map(id => {
    return { href: id, access: 'public' };
  });
};

function toFullIds (base, ids) {
  return ids.map(id => base + '#' + id);
}

function toLinks (base, anchors) {
  const ret = {};
  ret[base] = { anchors };
  return ret;
}

const populateSpec = (url, ids, links, dfns) => {
  dfns = dfns ?? idsToDfns(ids);
  const shortname = url.slice(0, -1).split('/').pop();
  return {
    url: toTr(url),
    ids,
    links,
    dfns,
    nightly: {
      url
    },
    release: {
      url: toTr(url)
    },
    shortname,
    series: { shortname }
  };
};

function toCrawlResults (ids, links, trIds = ids) {
  return {
    ed: [populateSpec(specEdUrl, toFullIds(specEdUrl, ids), []),
      populateSpec(specEdUrl2, [], toLinks(specEdUrl, links))],
    tr: [populateSpec(specEdUrl, toFullIds(specEdUrl, trIds), [])]
  };
}

describe('The links analyser', () => {
  it('reports no anomaly if links are valid', () => {
    const ids = ['validid'];
    const crawlResult = toCrawlResults(ids, ids);
    const report = studyBackrefs(crawlResult.ed, crawlResult.tr);
    assertNbAnomalies(report, 0);
  });

  it('reports a broken link', () => {
    const ids = ['validid'];
    const crawlResult = toCrawlResults([], ids);
    const report = studyBackrefs(crawlResult.ed, crawlResult.tr);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      category: 'links',
      message: specEdUrl + '#' + ids[0]
    });
  });

  /* TOTEST
    "datedUrls",
    "evolvingLinks",
    "frailLinks",
    "nonCanonicalRefs",
    "notDfn",
    "notExported",
    "outdatedSpecs",
    "unknownSpecs"
  */
});
