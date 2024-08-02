import { canonicalizeUrl, canonicalizesTo } from './canonicalize-url.js';

/**
 * Helper function that returns true when the given URL seems to target a real
 * "spec" (as opposed to, say, a Wiki page, or something else)
 */
const matchSpecUrl = url =>
  url.match(/spec.whatwg.org/) ||
  url.match(/www.w3.org\/TR\/[a-z0-9]/) ||
  (url.match(/w3c.github.io/) && ! url.match(/w3c.github.io\/test-results\//));

function studyReferences (specs, { crawlResults = null } = {}) {
  crawlResults = crawlResults ?? specs;

  // Construct spec equivalence from the crawl report
  const specEquivalents = {};
  for (const spec of crawlResults) {
    for (const v of (spec.versions ?? [])) {
      if (specEquivalents[v]) {
        if (Array.isArray(specEquivalents[v])) {
          specEquivalents[v].push(spec.url);
        }
        else {
          specEquivalents[v] = [specEquivalents[v], spec.url];
        }
      }
      else {
        specEquivalents[v] = spec.url;
      }
    }
  }

  // Strong canonicalization options to find references
  const useEquivalents = {
    datedToLatest: true,
    equivalents: specEquivalents
  };

  const report = [];
  for (const spec of specs) {
    for (const ref of spec.refs?.normative ?? []) {
      const referencedSpec = crawlResults.find(s =>
        s.url === ref.url ||
        s?.nightly?.url === ref.url ||
        s?.nightly?.alternateUrls?.includes(ref.url));
      if (referencedSpec && referencedSpec.standing === "discontinued") {
        const newSpecsLinks = crawlResults
          .filter(s => referencedSpec.obsoletedBy?.includes(s.shortname))
          .map(s => `[${s.shortname}](${s?.nightly?.url || s.url})`);
        report.push({
          name: 'discontinuedReferences',
          message: `[${ref.name}](${ref.url}) ${newSpecsLinks.length ? `has been obsoleted by ${newSpecsLinks}` : `is discontinued, no known replacement reference`}`,
          spec
        });
      }
    }

    // Detect links to external specifications within the body of the spec
    // that do not have a corresponding entry in the list of references
    // (all links to external specs should have a companion ref)
    Object.keys(spec.links?.rawlinks ?? {})
      .filter(matchSpecUrl)
      .filter(l => {
        // Filter out "good" and "inconsistent" references
        const canon = canonicalizeUrl(l, useEquivalents);
        const refs = (spec.refs?.normative ?? []).concat(spec.refs?.informative ?? []);
        return !refs.find(r => canonicalizesTo(r.url, canon, useEquivalents));
      })
      .filter(l =>
        // Ignore links to other versions of "self". There may
        // be cases where it would be worth reporting them but
        // most of the time they appear in "changelog" sections.
        !canonicalizesTo(l, spec.url, useEquivalents) &&
        !canonicalizesTo(l, spec.versions, useEquivalents)
      )
      .forEach(l => {
        report.push({
          name: 'missingReferences',
          message: l,
          spec
        });
      });

    // Detect links to external specifications within the body of the spec
    // that have a corresponding entry in the references, but for which the
    // reference uses a different URL, e.g., because the link targets the
    // Editor's Draft, whereas the reference targets the latest published
    // version
    Object.keys(spec.links?.rawlinks ?? {})
      .filter(matchSpecUrl)
      .map(l => {
        const canonSimple = canonicalizeUrl(l);
        const canon = canonicalizeUrl(l, useEquivalents);
        const refs = (spec.refs?.normative ?? [])
          .concat(spec.refs?.informative ?? []);

        // Filter out "good" references
        if (refs.find(r => canonicalizesTo(r.url, canonSimple))) {
          return null;
        }
        const ref = refs.find(r => canonicalizesTo(r.url, canon, useEquivalents));
        return (ref ? { link: l, ref } : null);
      })
      .filter(anomaly => !!anomaly)
      .forEach(anomaly => {
        report.push({
          name: 'inconsistentReferences',
          message: `${anomaly.link}, related reference "${anomaly.ref.name}" uses URL ${anomaly.ref.url}`,
          spec
        });
      });
  }
  return report;
}

export default studyReferences;
