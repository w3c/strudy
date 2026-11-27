import { describe, it } from 'node:test';
import studyCSS from '../src/lib/study-css.js';
import { assertNbAnomalies, assertAnomaly } from './util.js';

const specUrl = 'https://www.w3.org/TR/spec';
const specUrl2 = 'https://www.w3.org/TR/spec2';

describe('The CSS analyser', () => {
  it('reports types that look like functions', async () => {
    const crawlResults = [
      {
        url: specUrl,
        css: {
          values: [
            {
              name: '<foo()>',
              type: 'type',
              href: specUrl + '#foo'
            }
          ]
        }
      }
    ];
    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'cssTypeMismatch',
      message: '`<foo()>` is defined as `type` instead of `function`',
      spec: { url: specUrl }
    });
  });

  it('reports functions that look like types', async () => {
    const crawlResults = [
      {
        url: specUrl,
        css: {
          values: [
            {
              name: 'foo',
              type: 'function',
              href: specUrl + '#foo'
            }
          ]
        }
      }
    ];
    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'cssTypeMismatch',
      message: '`foo` is defined as `function` instead of `type`',
      spec: { url: specUrl }
    });
  });

  it('reports multiple definitions in unrelated specs', async () => {
    const css = {
      values: [
        {
          name: 'foo()',
          type: 'function',
          href: specUrl + '#foo'
        }
      ]
    };
    const crawlResults = [
      {
        url: specUrl,
        shortname: 'spec1',
        series: {
          shortname: 'series1'
        },
        css
      },
      {
        url: specUrl2,
        shortname: 'spec2',
        series: {
          shortname: 'series2'
        },
        css
      }
    ];
    
    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'cssRedefined',
      message: '`foo()` gets redefined in different spec series, found definitions in spec1, spec2',
      specs: crawlResults
    });
  });

  it('reports about scoped vs. unscoped', async () => {
    const crawlResults = [
      {
        url: specUrl,
        css: {
          properties: [
            {
              name: 'prop',
              href: specUrl + '#prop',
              values: [
                {
                  name: 'foo()',
                  type: 'function',
                  href: specUrl + '#prop-foo'
                },
                {
                  name: 'bar()',
                  type: 'function',
                  value: 'bar(bu)',
                  href: specUrl + '#prop-bar'
                }
              ]
            }
          ],
          values: [
            {
              name: 'foo()',
              type: 'function',
              href: specUrl + '#foo'
            },
            {
              name: 'bar()',
              type: 'function',
              value: 'bar(bant)',
              href: specUrl + '#bar'
            }
          ]
        }
      }
    ];
    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'cssScoped',
      message: '`foo()` for `prop` is also defined without scoping in https://www.w3.org/TR/spec, same syntax',
      spec: { url: specUrl }
    });
    assertAnomaly(report, 1, {
      name: 'cssScoped',
      message: '`bar()` for `prop` is also defined without scoping in https://www.w3.org/TR/spec, syntaxes differ',
      spec: { url: specUrl }
    });
  });

  it('reports extensions without base definitions', async () => {
    const css = {
      properties: [
        {
          name: 'foo',
          newValues: 'bar',
          href: specUrl + '#foo'
        }
      ]
    };
    const crawlResults = [
      {
        url: specUrl,
        shortname: 'spec1',
        css
      }
    ];

    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'cssMissingBaseDfn',
      message: '`foo` is extended in spec1, but base definition was not found',
      spec: { url: specUrl }
    });
  });

  it('reports missing links back to the spec', async () => {
    const crawlResults = [
      {
        url: specUrl,
        css: {
          values: [
            {
              name: 'foo()',
              type: 'function'
            }
          ]
        }
      }
    ];
    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'cssMissingHref',
      message: '`foo()`',
      spec: { url: specUrl }
    });
  });

  it('reports placeholder values in syntaxes', async () => {
    const crawlResults = [
      {
        url: specUrl,
        css: {
          properties: [
            {
              name: 'prop',
              href: specUrl + '#prop',
              value: 'auto | none | bikeshed-this | [ <string> <string> ]+'
            }
          ]
        }
      }
    ];
    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'cssPlaceholderValue',
      message: '`prop`',
      spec: { url: specUrl }
    });
  });

  it('reports crawl warnings', async () => {
    const crawlResults = [
      {
        url: specUrl,
        css: {
          warnings: [
            {
              "msg": "Dangling value",
              "name": "Do Not Upgrade",
              "type": "value",
              "href": "https://w3c.github.io/webappsec-upgrade-insecure-requests/#valdef-insecure-requests-policy-do-not-upgrade"
            },
            {
              "msg": "Dangling value",
              "name": "avoid-page",
              "href": "https://drafts.csswg.org/css-break-4/#valdef-break-inside-avoid-page",
              "type": "value",
              "for": "page-break-inside"
            },
            {
              "msg": "Missing definition",
              "name": "<query-in-parens>",
              "value": "... | anchored( <anchored-query> )"
            },
            {
              "msg": 'Unmergeable definition',
              "name": "scrollbar-gutter",
              "newValues": 'auto | [ [ stable | always ] && mirror? && force? ] || match-parent'
            },
            {
              "msg": "Duplicate definition",
              "name": "<my-type>",
              "type": "type"
            },
            {
              "msg": "Something looks off",
              "name": "<my-type>",
              "type": "type"
            }
          ]
        }
      }
    ];
    const report = await studyCSS(crawlResults);
    assertNbAnomalies(report, 6);
    assertAnomaly(report, 0, {
      name: 'cssWarning',
      message: 'value [`Do Not Upgrade`](https://w3c.github.io/webappsec-upgrade-insecure-requests/#valdef-insecure-requests-policy-do-not-upgrade) - Dangling value',
      spec: { url: specUrl }
    });
    assertAnomaly(report, 1, {
      name: 'cssWarning',
      message: 'value [`avoid-page`](https://drafts.csswg.org/css-break-4/#valdef-break-inside-avoid-page) for `page-break-inside` - Dangling value',
      spec: { url: specUrl }
    });
    assertAnomaly(report, 2, {
      name: 'cssWarning',
      message: '`<query-in-parens>` - Missing definition',
      spec: { url: specUrl }
    });
    assertAnomaly(report, 3, {
      name: 'cssWarning',
      message: '`scrollbar-gutter` - Unmergeable definition',
      spec: { url: specUrl }
    });
    assertAnomaly(report, 4, {
      name: 'cssWarning',
      message: 'type `<my-type>` - Duplicate definition',
      spec: { url: specUrl }
    });
    assertAnomaly(report, 5, {
      name: 'cssWarning',
      message: 'type `<my-type>` - Something looks off',
      spec: { url: specUrl }
    });
  });
});