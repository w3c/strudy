/**
 * The CSS checker analyzes CSS extracts and reports on constructs that look
 * suspicious:
 * - constructs defined as "type" whereas they seem to be a "function", such as
 * `<foo()>`
 * - constructs re-defined in specs that do not belong to the same series
 * - constructs that exist both as scoped (for another property) and unscoped,
 * when the underlying syntax is different.
 *
 * @module checker
 */

/**
 * High-level categories of CSS features that the CSS extracts contain
 */
const categories = [
  'atRules',
  'properties',
  'selectors',
  'values'
];

const specName = spec => spec.shortname ?? spec.url;

/**
 * Checks the CSS extracts
 *
 * @function
 * @public
 */
export default function studyCSS(specs, { crawlResults = null } = {}) {
  const res = [];

  // Record an anomaly for the given spec(s),
  // provided we are indeed interested in the results
  function recordAnomaly(spec, anomaly) {
    if (Array.isArray(spec)) {
      const filtered = spec.filter(sp => specs.find(s => s.shortname === sp.shortname));
      if (filtered.length > 0) {
        res.push(Object.assign({}, anomaly, { specs: filtered }));
      }
    }
    else {
      if (specs.find(s => s.shortname === spec.shortname)) {
        res.push(Object.assign({}, anomaly, { spec }));
      }
    }
  }

  // We need to consider all CSS definitions, even if caller is only interested
  // in a few specific specs.
  const allSpecs = (crawlResults?.length ? crawlResults : specs)
    .filter(spec => spec.css);

  // Merge features into a single namespace.
  // Note: names in different categories follow different naming conventions,
  // and don't collide in practice.
  const features = {};
  for (const spec of allSpecs) {
    for (const category of categories) {
      for (const feature of spec.css[category] ?? []) {
        let featureName = '`' + feature.name + '`';
        if (!features[featureName]) {
          features[featureName] = [];
        }
        features[featureName].push(Object.assign({ spec }, feature));

        // Also add scoped functions and types definitions
        for (const value of feature.values ?? []) {
          if (value.type === 'function' || value.type === 'type') {
            featureName = '`' + value.name + '` for `' + feature.name + '`';
            if (!features[featureName]) {
              features[featureName] = [];
            }
            features[featureName].push(Object.assign(
              { spec, for: feature.name },
              value));
          }
        }
      }
    }
  }

  // Analyze the merged list of features
  for (const [name, dfns] of Object.entries(features)) {
    // Filter out definitions that extend a base definition
    let actualDfns = dfns.filter(dfn => dfn.value);
    if (actualDfns.length === 0) {
      // No base definition found? Let's report if extensions are defined.
      // Otherwise, that just means we don't have a value for the base
      // definition. That's fine, we'll just assume the first dfn that is
      // not an extension is the base definition
      for (const dfn of dfns) {
        if (dfn.newValues) {
          recordAnomaly(dfn.spec, {
            name: 'cssMissingBaseDfn',
            message: `${name} is extended in ${specName(dfn.spec)}, but base definition was not found`
          });
        }
      }
      actualDfns = dfns.filter(dfn => !dfn.newValues);
    }
    for (const dfn of actualDfns) {
      if (!dfn.href) {
        recordAnomaly(dfn.spec, {
          name: 'cssMissingHref',
          message: name
        });
      }
      // Look for any placeholder value per:
      // https://github.com/w3c/webref/issues/2106
      // Note: The match is quite lax, but in practice no syntax should ever
      // need to include "bikeshed", and we can restrict the check further over
      // time if needed.
      if (dfn.value?.match(/bikeshed/i)) {
        recordAnomaly(dfn.spec, {
          name: 'cssPlaceholderValue',
          message: name
        });
      }
    }

    // Look for redefinitions in different spec series
    const series = {};
    for (const dfn of actualDfns) {
      // Note: crawls have series information for all specs, tests may not
      const seriesShortname = dfn.spec?.series?.shortname;
      if (seriesShortname) {
        if (!series[seriesShortname]) {
          series[seriesShortname] = [];
        }
        series[seriesShortname].push(dfn.spec);
      }
    }
    if (Object.keys(series).length > 1) {
      const specs = Object.values(series).flat();
      recordAnomaly(specs, {
        name: 'cssRedefined',
        message: name + ' gets redefined in different spec series, found definitions in ' + specs.map(specName).join(', ')
      });
    }

    // Check scoped definitions don't also have an unscoped definition.
    const reScoped = /^(.*) for .*/;
    if (name.match(reScoped)) {
      const unscopedName = name.replace(reScoped, '$1');
      const unscoped = features[unscopedName];
      if (unscoped) {
        // Note we're going to take the first value definition
        // (in raw extracts, there may be duplicates, but these will be
        // reported as anomalies in any case)
        const actualScoped = dfns.find(dfn => dfn.value);
        const actualUnscoped = unscoped.find(dfn => dfn.value);
        if (actualScoped?.value !== actualUnscoped?.value) {
          recordAnomaly(actualScoped?.spec ?? dfns[0].spec, {
            name: 'cssScoped',
            message: `${name} is also defined without scoping in ${specName(actualUnscoped?.spec ?? unscoped[0].spec)}, syntaxes differ`
          });
        }
        else {
          recordAnomaly(actualUnscoped?.spec ?? unscoped[0].spec, {
            name: 'cssScoped',
            message: `${name} is also defined without scoping in ${specName(actualUnscoped?.spec ?? unscoped[0].spec)}, same syntax`
          });
        }
      }
    }
  }

  // Check that features that look like types are correctly defined as such,
  // and same thing for functions.
  for (const spec of specs) {
    if (!spec.css) {
      continue;
    }
    for (const feature of spec.css.values ?? []) {
      if (feature.type === 'type' && feature.name.match(/^<.*\(\)>$/)) {
        recordAnomaly(spec, {
          name: 'cssTypeMismatch',
          message: '`' + feature.name + '` is defined as `type` instead of `function`'
        });
      }
      else if (feature.type === 'function' && !feature.name.match(/^.*\(\)$/)) {
        recordAnomaly(spec, {
          name: 'cssTypeMismatch',
          message: '`' + feature.name + '` is defined as `function` instead of `type`'
        });
      }
    }
  }

  // Surface warnings reported by the crawler
  for (const spec of specs) {
    if (!spec.css?.warnings) {
      continue;
    }
    for (const warning of spec.css.warnings) {
      recordAnomaly(spec, {
        name: 'cssWarning',
        message: (warning.type ? warning.type + ' ' : '') +
          (warning.href ? '[`' + warning.name + '\`](' + warning.href + ')' : '`' + warning.name + '`') +
          (warning.for ? ' for `' + warning.for + '`' : '') +
          ' - ' + warning.msg
      });
    }
  }
  return res;
}