import studyDefinitions from '../src/lib/study-dfns.js';
import { assertNbAnomalies, assertAnomaly } from './util.js';

describe('The definitions analyser', () => {
  const specUrl = 'https://www.w3.org/TR/spec';
  const specUrl2 = 'https://www.w3.org/TR/spec2';

  function toCrawlResult({ css = {}, dfns = [], idlparsed = {} }) {
    const crawlResult = [{
      url: specUrl,
      css, dfns, idlparsed
    }];
    return crawlResult;
  }

  it('reports no anomaly if there are no definitions', () => {
    const crawlResult = toCrawlResult({});
    const report = studyDefinitions(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('reports missing definition anomalies from CSS extracts', () => {
    const crawlResult = toCrawlResult({
      css: {
        warnings: [{
          msg: 'Missing definition',
          name: 'no-def',
          type: 'value'
        }]
      }
    });
    const report = studyDefinitions(crawlResult);
    assertAnomaly(report, 0, {
      name: 'missingDfns',
      message: '`no-def` with type `value`',
      spec: { url: 'https://www.w3.org/TR/spec' }
    });
  });
});