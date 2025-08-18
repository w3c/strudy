import { describe, it } from 'node:test';
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
      name: 'missingTask',
      message: 'The algorithm that starts with "The encodingInfo() method MUST run the following steps:" resolves/rejects a promise directly in a step that runs in parallel',
      spec: { url: 'https://www.w3.org/TR/spec' }
    });
  });

  it('reports no anomaly when a step queues a custom task', () => {
    const crawlResult = toCrawlResult([
      {
        html: 'The custom() method MUST run the following steps:',
        rationale: 'if',
        steps: [
          { html: 'Let <var>p</var> be a new promise.' },
          { html: 'In parallel',
            steps: [
              { html: 'Queue a custom but fantastic task to resolve <var>p</var> with undefined' }
            ]
          }
        ]
      }
    ]);
    const report = study(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('reports no anomaly for the push API', () => {
    const crawlResult = toCrawlResult([
      {
        html: 'Then run the following steps in parallel, with <var>dispatchedEvent</var>:',
        rationale: 'wait',
        steps: [
          { html: '<p>Wait for all of the promises in the <a data-link-type=\"dfn\" data-link-for=\"ExtendableEvent\" data-xref-for=\"ExtendableEvent\" data-cite=\"service-workers\" data-cite-path=\"\" data-cite-frag=\"extendableevent-extend-lifetime-promises\" href=\"https://www.w3.org/TR/service-workers/#extendableevent-extend-lifetime-promises\">extend lifetime promises</a> of <var>dispatchedEvent</var> to resolve.</p>' },
          { html: '<p>If they do not resolve successfully, then set <var>notificationResult</var> to something.</p>' },
          { html: '<p>Otherwise, do something else.</p>' }
        ]
      }
    ]);
    const report = study(crawlResult);
    assertNbAnomalies(report, 0);
  });
});
