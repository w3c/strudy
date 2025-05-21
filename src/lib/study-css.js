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

  // We need to consider all CSS definitions, even if caller is only interested
  // in a few specific specs.
  const allSpecs = ((crawlResults?.length > 0) ? crawlResults : specs)
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
      // definition. That's find, we'll just assume the first dfn that is
      // not an extension is the base definition
      for (const dfn of dfns) {
        if (dfn.newValues) {
          res.push({
            name: 'cssMissingBaseDfn',
            message: `${name} is extended in ${specName(dfn.spec)}, but base definition was not found`,
            spec: dfn.spec
          });
        }
      }
      actualDfns = dfns.filter(dfn => !dfn.newValues);
    }
    for (const dfn of actualDfns) {
      if (!dfn.href) {
        res.push({
          name: 'cssMissingHref',
          message: name,
          spec: dfn.spec
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
      res.push({
        name: 'cssRedefined',
        message: name + ' gets redefined in different spec series, found definitions in ' + specs.map(specName).join(', '),
        specs
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
          res.push({
            name: 'cssScoped',
            message: `${name} is also defined without scoping in ${specName(actualUnscoped?.spec ?? unscoped[0].spec)}, syntaxes differ`,
            spec: actualScoped?.spec ?? dfns[0].spec
          });
        }
        else {
          res.push({
            name: 'cssScoped',
            message: `${name} is also defined without scoping in ${specName(actualUnscoped?.spec ?? unscoped[0].spec)}, same syntax`,
            spec: actualUnscoped?.spec ?? unscoped[0].spec
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
        res.push({
          name: 'cssTypeMismatch',
          message: '`' + feature.name + '` is defined as `type` instead of `function`',
          spec
        });
      }
      else if (feature.type === 'function' && !feature.name.match(/^.*\(\)$/)) {
        res.push({
          name: 'cssTypeMismatch',
          message: '`' + feature.name + '` is defined as `function` instead of `type`',
          spec
        });
      }
    }
  } 
  return res;
}