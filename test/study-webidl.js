/**
 * Tests the Web IDL analysis library.
 */

const assert = require('assert').strict;
const { studyWebIdl } = require('../src/lib/study-webidl');

describe('The Web IDL analyser', async _ => {
  const specUrl = 'https://www.w3.org/TR/spec';
  const specUrl2 = 'https://www.w3.org/TR/spec2';

  function toCrawlResult(idl, url) {
    url = url ?? specUrl;
    return [ { url, idl } ];
  }

  async function analyzeIdl(idl) {
    const crawlResult = toCrawlResult(idl);
    return studyWebIdl(crawlResult);
  }


  it('reports no anomaly if IDL is valid', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assert.deepEqual(report, []);
  });


  it('reports invalid IDL', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    assert.deepEqual(report[0]?.name, 'invalid');
    assert.deepEqual(report[0].message, `Syntax error at line 3, since \`interface Invalid\`:
interface Invalid;
                 ^ Bodyless interface`);
    assert.deepEqual(report[0].category, 'webidl');
    assert.deepEqual(report[0].specs?.length, 1);
    assert.deepEqual(report[0].specs[0].url, specUrl);
  });


  it('forgets about previous results', async () => {
    await analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assert.deepEqual(report, []);
  });


  it('detects missing [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
interface Unexposed {};
`);
    assert.deepEqual(report[0]?.name, 'noExposure');
    assert.deepEqual(report[0].message, 'The interface "Unexposed" has no [Exposed] extended attribute');
  });


  it('detects unknown [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
[Exposed=Unknown]
interface WhereIAm {};
`);
    assert.deepEqual(report[0]?.name, 'unknownExposure');
    assert.deepEqual(report[0].message, 'The [Exposed] extended attribute of the interface "WhereIAm" references unknown global(s): Unknown');
  });

  it('reports no anomaly for valid EventHandler attributes definitions', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Carlos : EventTarget {
  attribute EventHandler onbigbisous;
};
`);
    assert.deepEqual(report, []);
  });


  it('detects unexpected EventHandler attributes', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Carlos {
  attribute EventHandler onbigbisous;
};
`);
    assert.deepEqual(report[0]?.name, 'unexpectedEventHandler');
    assert.deepEqual(report[0].message, 'The interface "Carlos" defines an event handler "onbigbisous" but does not inherit from EventTarget');
  });


  it('detects incompatible partial exposure issues', async () => {
    const report = await analyzeIdl(`
[Global=Somewhere,Exposed=*]
interface Somewhere {};

[Global=Elsewhere,Exposed=Elsewhere]
interface Elsewhere {};

[Exposed=Somewhere]
interface MyPlace {};

// This is correct since Somewhere is exposed everywhere
[Exposed=Elsewhere]
partial interface Somewhere {};

// This is incorrect since MyPlace is only Somewhere
[Exposed=Elsewhere]
partial interface MyPlace {};
`);
    assert.deepEqual(report[0]?.name, 'incompatiblePartialIdlExposure');
    assert.deepEqual(report[0].message, 'The [Exposed] extended attribute of the partial interface "MyPlace" references globals on which the original interface is not exposed: Elsewhere (original exposure: Somewhere)');
    assert.deepEqual(report.length, 1);
  });


  it('detects incompatible partial exposure issues when "*" is used', async () => {
    const report = await analyzeIdl(`
[Global=Somewhere,Exposed=Somewhere]
interface Somewhere {};

// This is incorrect because Somewhere is only exposed Somewhere and there
// may well be other globals that we're not aware of
[Exposed=*]
partial interface Somewhere {};
`);
    assert.deepEqual(report[0]?.name, 'incompatiblePartialIdlExposure');
    assert.deepEqual(report[0].message, 'The partial interface "Somewhere" is exposed on all globals but the original interface is not (Somewhere)');
    assert.deepEqual(report.length, 1);
  });


  it('detects IDL names that are redefined across specs', async () => {
    const crawlResult = toCrawlResult(`
dictionary GrandBob {
  required boolean complete;
};
`).concat(toCrawlResult(`
dictionary GrandBob {
  required boolean incomplete;
};
`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assert.deepEqual(report[0]?.name, 'redefined');
    assert.deepEqual(report[0].message, `"GrandBob" is defined as a non-partial dictionary mutiple times in ${specUrl}, ${specUrl2}`);
    assert.deepEqual(report[0].specs?.length, 2);
    assert.deepEqual(report[0].specs[0].url, specUrl);
    assert.deepEqual(report[0].specs[1].url, specUrl2);
    assert.deepEqual(report.length, 1);
  });


  it('detects IDL names that are redefined with different types across specs', async () => {
    const crawlResult = toCrawlResult(
`dictionary GrandBob {
  required boolean complete;
};`).concat(toCrawlResult(
`enum GrandBob {
  "complete",
  "incomplete"
};`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assert.deepEqual(report[0]?.name, 'redefinedWithDifferentTypes');
    assert.deepEqual(report[0].message, `"GrandBob" is defined multiple times with different types (dictionary, enum) in ${specUrl}, ${specUrl2}`);
    assert.deepEqual(report[0].specs?.length, 2);
    assert.deepEqual(report[0].specs[0].url, specUrl);
    assert.deepEqual(report[0].specs[1].url, specUrl2);
    assert.deepEqual(report.length, 1);
  });


  it('detects the lack of original definition for partials', async () => {
    const report = await analyzeIdl(`
partial interface MyPlace {};
`);
    assert.deepEqual(report[0]?.name, 'noOriginalDefinition');
    assert.deepEqual(report[0].message, `"MyPlace" is only defined as a partial interface (in ${specUrl})`);
    assert.deepEqual(report.length, 1);
  });
});
