/**
 * Tests CDDL analysis.
 *
 * Note line numbers in reported anomalies are off by 5. That's normal, the
 * analysis compensates for the header that Reffy adds to the CDDL extracts
 * and that isn't included in the tests.
 */
import { describe, it } from 'node:test';

import study from '../src/lib/study-cddl.js';
import { assertNbAnomalies, assertAnomaly } from './util.js';

describe('The CDDL analyser', {timeout: 5000}, function () {

  const specUrl = 'https://www.w3.org/TR/spec';
  const specUrl2 = 'https://www.w3.org/TR/spec2';

  function toCrawlResult (cddl, cddl2) {
    const crawlResult = [];

    function addSpecAndCddl(url, cddl) {
      if (typeof cddl === 'string') {
        crawlResult.push({ url, cddl: [{ name: '', cddl }] });
      }
      else if (Array.isArray(cddl)) {
        crawlResult.push({ url, cddl });
      }
      else {
        crawlResult.push({ url, cddl: [cddl] });
      }
    }
    
    addSpecAndCddl(specUrl, cddl);
    if (cddl2) {
      addSpecAndCddl(specUrl2, cddl2);
    }
    return crawlResult;
  }

  function analyzeCddl (cddl, cddl2) {
    const crawlResult = toCrawlResult(cddl, cddl2);
    return study(crawlResult);
  }

  it('reports no anomaly if CDDL is valid', async () => {
    const crawlResult = toCrawlResult('cddl = tstr');
    const report = await study(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('reports an anomaly when CDDL is invalid', async () => {
    const crawlResult = toCrawlResult('cddl');
    const report = await study(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'invalidCddl',
      message: 'CDDL syntax error - line 6: expected assignment (`=`, `/=`, `//=`) after `cddl`, got ``',
      spec: { url: specUrl }
    });
  });

  it('reports the CDDL module name', async () => {
    const crawlResult = toCrawlResult({
      name: 'mo-mo-mo',
      cddl: 'nan = 0.'
    });
    const report = await study(crawlResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'invalidCddl',
      message: 'In the "mo-mo-mo" module, CDDL token error - line 6: expected number with fraction to have digits in fraction part, got `0.`',
      spec: { url: specUrl }
    });
  });

  it('validates all CDDL modules', async () => {
    const crawlResult = toCrawlResult([
      { name: 'all', cddl: 'cddl = tstr\nnobinary = 0b' },
      { name: 'valid', cddl: 'cddl = tstr' },
      { name: 'invalid', cddl: 'nobinary = 0b'}
    ]);
    const report = await study(crawlResult);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'invalidCddl',
      message: 'In the "all" module, CDDL token error - line 7: expected binary number to have binary digits, got `0b`',
      spec: { url: specUrl }
    });
    assertAnomaly(report, 1, {
      name: 'invalidCddl',
      message: 'In the "invalid" module, CDDL token error - line 6: expected binary number to have binary digits, got `0b`',
      spec: { url: specUrl }
    });
  });
});
