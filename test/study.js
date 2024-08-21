import study from '../src/lib/study.js';
import { assertNbAnomalies, assertAnomaly } from './util.js';

const specUrl = 'https://w3c.github.io/world/';
const specUrl2 = 'https://w3c.github.io/universe/';

function toTr(url) {
  return url.replace('https://w3c.github.io', 'https://www.w3.org/TR');
}

function populateSpec(url, crawl) {
  const shortname = url.slice(0, -1).split('/').pop();
  const spec = Object.assign({
    shortname,
    title: `Hello ${shortname} API`,
    url: toTr(url),
    nightly: { url },
    release: { url: toTr(url) },
    crawled: url
  }, crawl);
  return spec;
}

describe('The main study function', function () {
  this.slow(5000);
  this.timeout(10000);

  it('reports no anomaly when spec is empty', async function() {
    const crawlResult = [{ url: specUrl }];
    const report = await study(crawlResult, { htmlFragments: {} });
    assertNbAnomalies(report.results, 0);
  });

  it('reports anomalies per type and spec by default', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { htmlFragments: {} });
    assertNbAnomalies(report.results, 2);
    assertAnomaly(report.results, 0, {
      title: 'Crawl error in Hello world API',
      content:
`While crawling [Hello world API](${specUrl}), the following crawl errors occurred:
* [ ] Boo`
    });
    assertAnomaly(report.results, 1, {
      title: 'Crawl error in Hello universe API',
      content:
`While crawling [Hello universe API](${specUrl2}), the following crawl errors occurred:
* [ ] Borked`
    });
  });

  it('reports anomalies per type when asked', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { structure: 'type/spec', htmlFragments: {} });
    assertNbAnomalies(report.results, 1);
    assertAnomaly(report.results, 0, {
      title: 'Crawl error',
      content:
`The following crawl errors occurred:
* [Hello world API](https://w3c.github.io/world/)
  * [ ] Boo
* [Hello universe API](https://w3c.github.io/universe/)
  * [ ] Borked`
    });
  });

  it('reports anomalies per spec when asked', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { structure: 'spec/type', htmlFragments: {} });
    assertNbAnomalies(report.results, 2);
    assertAnomaly(report.results, 0, {
      title: 'Hello world API',
      content:
`While crawling [Hello world API](https://w3c.github.io/world/), the following anomalies were identified:
* Crawl error
  * [ ] Boo`
    });
  });

  it('reports anomalies per spec and groups anomalies when asked', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { structure: 'spec/group/type', htmlFragments: {} });
    assertNbAnomalies(report.results, 2);
    assertAnomaly(report.results, 0, {
      title: 'Hello world API',
      content:
`While crawling [Hello world API](https://w3c.github.io/world/), the following anomalies were identified:
* Generic
  * Crawl error
    * [ ] Boo`
    });
  });

  it('reports anomalies per group and spec when asked', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { structure: 'group+spec/type', htmlFragments: {} });
    assertNbAnomalies(report.results, 2);
    assertAnomaly(report.results, 0, {
      title: 'Generic in Hello world API',
      content:
`While crawling [Hello world API](https://w3c.github.io/world/), the following errors prevented the spec from being analyzed:
* Crawl error
  * [ ] Boo`
    });
  });

  it('reports anomalies per group, with anomaly type as intermediary level, when asked', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { structure: 'group/type/spec', htmlFragments: {} });
    assertNbAnomalies(report.results, 1);
    assertAnomaly(report.results, 0, {
      title: 'Generic',
      content:
`The following errors prevented the spec from being analyzed:
* Crawl error
  * [Hello world API](https://w3c.github.io/world/)
    * [ ] Boo
  * [Hello universe API](https://w3c.github.io/universe/)
    * [ ] Borked`
    });
  });

  it('reports anomalies per group, with spec as intermediary level, when asked', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { structure: 'group/spec/type', htmlFragments: {} });
    assertNbAnomalies(report.results, 1);
    assertAnomaly(report.results, 0, {
      title: 'Generic',
      content:
`The following errors prevented the spec from being analyzed:
* [Hello world API](https://w3c.github.io/world/)
  * Crawl error
    * [ ] Boo
* [Hello universe API](https://w3c.github.io/universe/)
  * Crawl error
    * [ ] Borked`
    });
  });

  it('only reports anomalies for requested specs', async function() {
    const crawlResult = [
      populateSpec(specUrl, { error: 'Boo' }),
      populateSpec(specUrl2, { error: 'Borked' })
    ];
    const report = await study(crawlResult, { specs: ['universe'], htmlFragments: {} });
    assertNbAnomalies(report.results, 1);
  });
});