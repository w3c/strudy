/**
 * Tests the Web IDL analysis library.
 */

const assert = require('assert').strict;
const { studyWebIdl } = require('../src/lib/study-webidl');

describe('The Web IDL analyser', async _ => {
  const specUrl = 'https://www.w3.org/TR/spec';

  function toCrawlResult(idl) {
    return [
      {
        url: specUrl,
        title: 'Sample spec',
        crawled: specUrl,
        shortname: 'spec',
        nightly: { repository: 'https://github.com/w3c/spec' },
        idl
      }
    ];
  }

  it('reports no anomaly if IDL is valid', async () => {
    const crawlResult = toCrawlResult(
`[Global=Window,Exposed=*]
interface Valid {};`);
    const report = await studyWebIdl(crawlResult);
    assert.deepEqual(report, {});
  });

  it('reports invalid IDL', async () => {
    const crawlResult = toCrawlResult(
`[Global=Window,Exposed=*]
interface Invalid;`);
    const report = await studyWebIdl(crawlResult);
    assert.deepEqual(
      report?.[specUrl]?.invalidWebIdl?.[0],
      `Syntax error at line 2, since \`interface Invalid\`:
interface Invalid;
                 ^ Bodyless interface`);
  });

  it('forgets about previous results', async () => {
    await studyWebIdl(toCrawlResult(
`[Global=Window,Exposed=*]
interface Invalid;`));
    const crawlResult = toCrawlResult(
`[Global=Window,Exposed=*]
interface Valid {};`);
    const report = await studyWebIdl(crawlResult);
    assert.deepEqual(report, {});
  });

  it('warns when an [Exposed] extended attribute is missing', async () => {
    const crawlResult = toCrawlResult(
`interface Unexposed {};`);
    const report = await studyWebIdl(crawlResult);
    assert.deepEqual(
      report?.[specUrl]?.noIdlExposure?.[0],
      'Interface Unexposed has no [Exposed] extended attribute');
  });
});
