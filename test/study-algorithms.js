import study from '../src/lib/study-algorithms.js';
import { assertNbAnomalies, assertAnomaly } from './util.js';

describe('The algorithms analyser', () => {
  const specUrl = 'https://www.w3.org/TR/spec';
  const specUrl2 = 'https://www.w3.org/TR/spec2';

  function toCrawlResult(algorithms) {
    return [{ url: specUrl, algorithms }];
  }

  it('reports no anomaly if there are no algorithms', () => {
    const crawlResult = toCrawlResult([]);
    const report = study(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('reports an error when a step resolves a promise in parallel', () => {
    const crawlResult = toCrawlResult([
      {
        html: 'The <code class="idl"><a data-link-type="idl" href="https://w3c.github.io/media-capabilities/#dom-mediacapabilities-encodinginfo" id="ref-for-dom-mediacapabilities-encodinginfo">encodingInfo()</a></code> method MUST run the following steps:',
        rationale: 'if',
        steps: [
          { html: 'Let <var>p</var> be a new promise.' },
          { html: '<a data-link-type="dfn" href="https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel" id="ref-for-in-parallel①">In parallel</a>, run the <a data-link-type="dfn" href="https://w3c.github.io/media-capabilities/#create-a-mediacapabilitiesencodinginfo" id="ref-for-create-a-mediacapabilitiesencodinginfo">Create a MediaCapabilitiesEncodingInfo</a> algorithm with <var>configuration</var> and resolve <var>p</var> with its result.' },
          { html: 'Return <var>p</var>.' }
        ]
      }
    ]);
    const report = study(crawlResult);
    assertAnomaly(report, 0, {
      name: 'missingTaskForPromise',
      message: 'The algorithm that starts with "The encodingInfo() method MUST run the following steps:" has a parallel step that resolves/rejects a promise directly',
      spec: { url: 'https://www.w3.org/TR/spec' }
    });
  });
});