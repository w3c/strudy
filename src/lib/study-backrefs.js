const { recordCategorizedAnomaly } = require('./util');

const possibleAnomalies = [
  'brokenLinks',
  'datedUrls',
  'evolvingLinks',
  'frailLinks',
  'nonCanonicalRefs',
  'notDfn',
  'notExported',
  'outdatedSpecs',
  'unknownSpecs'
];

/**
 * The backrefs analyzer only checks links to other specs. This function returns
 * true when a link does target a spec, and false if it targets something else
 * (e.g. a test suite, a wiki page, an issue, etc.)
 *
 * TODO: Consider matching specs from the Khronos Group (but note there are
 * different types of resources under www.khronos.org0)
 * TODO: Consider matching TC39 specs... once we have dfns and IDs for them!
 */
const matchSpecUrl = url =>
  url.match(/spec\.whatwg\.org/) ||
  url.match(/www\.w3\.org\/TR\/[a-z0-9]/) ||

  // CSS drafts tend to link to various non-spec resources under *.csswg.org
  // (e.g. log.csswg.org or wiki.csswg.org)
  url.match(/(?<!log|hg|test|wiki)\.csswg\.org(?!\/issues)/) ||
  url.match(/\.fxtf\.org/) ||
  url.match(/\.css-houdini\.org/) ||

  url.match(/\.svgwg\.org/) ||
  (url.match(/\.github\.io/) && !url.match(/w3c\.github\.io\/test-results\//));

/*
 TODO: DRY
 Copied from browser-specs/src/compute-shortname.js
*/
function computeShortname (url) {
  function parseUrl (url) {
    // Handle /TR/ URLs
    const w3cTr = url.match(/^https?:\/\/(?:www\.)?w3\.org\/TR\/([^/]+)\/$/);
    if (w3cTr) {
      return w3cTr[1];
    }

    // Handle WHATWG specs
    const whatwg = url.match(/\/\/(.+)\.spec\.whatwg\.org\/?/);
    if (whatwg) {
      return whatwg[1];
    }

    // Handle TC39 Proposals
    const tc39 = url.match(/\/\/tc39\.es\/proposal-([^/]+)\/$/);
    if (tc39) {
      return 'tc39-' + tc39[1];
    }

    // Handle Khronos extensions
    const khronos = url.match(/https:\/\/registry\.khronos\.org\/webgl\/extensions\/([^/]+)\/$/);
    if (khronos) {
      return khronos[1];
    }

    // Handle extension specs defined in the same repo as the main spec
    // (e.g. generate a "gamepad-extensions" name for
    // https://w3c.github.io/gamepad/extensions.html")
    const ext = url.match(/\/.*\.github\.io\/([^/]+)\/(extensions?)\.html$/);
    if (ext) {
      return ext[1] + '-' + ext[2];
    }

    // Handle draft specs on GitHub, excluding the "webappsec-" prefix for
    // specifications developed by the Web Application Security Working Group
    const github = url.match(/\/.*\.github\.io\/(?:webappsec-)?([^/]+)\//);
    if (github) {
      return github[1];
    }

    // Handle CSS WG specs
    const css = url.match(/\/drafts\.(?:csswg|fxtf|css-houdini)\.org\/([^/]+)\//);
    if (css) {
      return css[1];
    }

    // Handle SVG drafts
    const svg = url.match(/\/svgwg\.org\/specs\/(?:svg-)?([^/]+)\//);
    if (svg) {
      return 'svg-' + svg[1];
    }

    // Return name when one was given
    if (!url.match(/\//)) {
      return url;
    }

    throw new Error(`Cannot extract meaningful name from ${url}`);
  }

  // Parse the URL to extract the name
  const name = parseUrl(url);

  // Make sure name looks legit, in other words that it is composed of basic
  // Latin characters (a-z letters, digits, underscore and "-"), and that it
  // only contains a dot for fractional levels at the end of the name
  // (e.g. "blah-1.2" is good but "blah.blah" and "blah-3.1-blah" are not)
  if (!name.match(/^[\w-]+((?<=-\d+)\.\d+)?$/)) {
    throw new Error(`Specification name contains unexpected characters: ${name} (extracted from ${url})`);
  }

  return name;
}

// shortnames for specs that should no longer be linked to
const shortNamesOfTransferedSpecs = {
  '2dcontext': 'html',
  '2dcontext2': 'html',
  cors: 'fetch',
  'custom-elements': 'html',
  domcore: 'dom',
  eventsource: 'html',
  html5: 'html',
  html50: 'html',
  html51: 'html',
  html52: 'html',
  'selectors-api': 'dom',
  webmessaging: 'html',
  websockets: 'html',
  html: 'html',
  webstorage: 'html',
  workers: 'html',
  'worklets-1': 'html',
  WebIDL: 'webidl',
  'WebIDL-1': 'webidl'
};

const outdatedShortnames = {
  BackgroundSync: 'background-sync',
  'content-security-policy': 'CSP',
  'css-selectors': 'selectors',
  'css-selectors-3': 'selectors-3',
  'css3-align': 'css-align-3',
  'css3-animations': 'css-animations-1',
  'css3-background': 'css-backgrounds',
  'css3-box': 'css-box-3',
  'css3-break': 'css-break-3',
  'css3-color': 'css-color-3',
  'css3-flexbox': 'css-flexbox-1',
  'css3-fonts': 'css-fonts-3',
  'css3-grid-layout': 'css-grid-1',
  'css3-images': 'css-images-3',
  'css3-mediaqueries': 'mediaqueries-3',
  'css3-multicol': 'css-multicol-1',
  'css3-namespace': 'css-namespaces-3',
  'css3-page': 'css-page-3',
  'css3-positioning': 'css-position',
  'css3-regions': 'css-regions-1',
  'css3-selectors': 'selectors-3',
  'css3-speech': 'css-speech-1',
  'css3-syntax': 'css-syntax-3',
  'css3-text': 'css-text-3',
  'css3-transforms': 'css-transforms-1',
  'css3-transitions': 'css-transitions-1',
  'css3-values': 'css-values-3',
  'css3-writing-modes': 'css-writing-modes-3',
  'feature-policy': 'permissions-policy',
  InputDeviceCapabilities: 'input-device-capabilities',
  IntersectionObserver: 'intersection-observer',
  mixedcontent: 'mixed-content',
  ServiceWorker: 'service-workers',
  powerfulfeatures: 'secure-contexts'
};

// TODO: check the link is non-normative (somehow)
const shortnameOfNonNormativeDocs = [
  'accept-encoding-range-test',
  'aria-practices',
  'Audio-EQ-Cookbook',
  'books',
  'capability-urls',
  'clreq',
  'css-2017',
  'css-print',
  'css3-marquee',
  'css3-preslev',
  'design-principles',
  'discovery-api',
  'dpub-latinreq',
  'dpub-pagination',
  'file-system-api',
  'fingerprinting-guidance',
  'html-design-principles',
  'ilreq',
  'installable-webapps',
  'jlreq',
  'klreq',
  'media-accessibility-reqs',
  'media-source-testcoverage',
  'motion-sensors',
  'predefined-counter-styles',
  'rdf11-primer',
  'security-privacy-questionnaire',
  'security-questionnaire',
  'sensor-polyfills',
  'sensors',
  'sniffly',
  'spatial-navigation',
  'ssml-sayas',
  'storage-partitioning',
  'streamproc',
  'touch-events-extensions',
  'typography',
  'using-aria',
  'wai-aria-implementation',
  'wai-aria-practices',
  'wai-aria-practices-1.1',
  'wai-aria-practices-1.2',
  'wai-aria-roadmap',
  'wake-lock-use-cases',
  'web-audio-perf',
  'web-intents',
  'webaudio-usecases',
  'webdatabase',
  'webrtc-interop-reports',
  'webrtc-nv-use-cases'
];

// the fragment part of URLs aren't systematically URL-encoded
// so we compare links both with and without an additional URL encoding pass
const matchAnchor = (url, anchor) => link => {
  return link === (url + '#' + anchor) || link === (url + '#' + encodeURIComponent(anchor));
};

function studyBackrefs (edResults, trResults = [], htmlFragments = {}) {
  trResults = trResults || [];
  const report = [];

  const recordAnomaly = recordCategorizedAnomaly(report, 'links', possibleAnomalies);

  edResults.forEach(spec => {
    Object.keys(spec.links?.rawlinks || {})
      .filter(matchSpecUrl)
      .forEach(link => {
        let shortname;
        if (spec.links.rawlinks[link].specShortname) {
          shortname = spec.links.rawlinks[link].specShortname;
        } else {
          let nakedLink = link;
          if (nakedLink.endsWith('.html')) {
            nakedLink = nakedLink.replace(/\/(Overview|overview|index)\.html$/, '/');
          }
          if (nakedLink[nakedLink.length - 1] !== '/') {
            nakedLink += '/';
          }

          // Detect links to dated specs
          const match = nakedLink.match(/www\.w3\.org\/TR\/[0-9]{4}\/([A-Z]+)-(.+)-[0-9]{8}\//);
          if (match) {
            // ED should not link to dated versions of the spec, unless it
            // voluntarily links to previous versions of itself
            if ((match[2] !== spec.shortname || outdatedShortnames[match[2]] === spec.shortname) && !['REC', 'NOTE'].includes(match[1])) {
              recordAnomaly(spec, 'datedUrls', link);
            }

            // TODO: consider pursuing the analysis with the non-dated version,
            // but note this may trigger some obscure broken fragment messages
            // when a fragment exists in the dated version but no longer exists
            // in the ED.
            return;
          }

          // Check whether the naked link matches any known URL in the crawl
          shortname = (edResults.find(r =>
            r.url === nakedLink ||
              (r.release && r.release.url === nakedLink) ||
              (r.nightly && r.nightly.url === nakedLink) ||
              (r.series && nakedLink === `https://www.w3.org/TR/${r.series.shortname}/`) && r.series.currentSpecification === r.shortname) || {}).shortname;

          // If it does not match any known URL, try to compute a shortname out of
          // it directly.
          if (!shortname) {
            try {
              shortname = computeShortname(nakedLink);
            } catch (e) {
              recordAnomaly(spec, 'unknownSpecs', link);
              return;
            }
          }
        }

        if ((link.match(/w3\.org/) || link.match(/w3c\.github\.io/)) && shortNamesOfTransferedSpecs[shortname]) {
          // The specification should no longer be referenced.
          // In theory, we could still try to match the anchor against the
          // right spec. In practice, these outdated specs are sufficiently
          // outdated that it does not make a lot of sense to do so.
          recordAnomaly(spec, 'outdatedSpecs', link);
          return;
        }
        // Links to WHATWG commit snapshots
        if (link.match(/spec\.whatwg\.org/) && link.match(/commit-snapshots/)) {
          recordAnomaly(spec, 'outdatedSpecs', link);
          return;
        }

        if (link.match(/heycam\.github\.io/)) {
          recordAnomaly(spec, 'nonCanonicalRefs', link);
          shortname = 'webidl';
        }
        if (outdatedShortnames[shortname]) {
          shortname = outdatedShortnames[shortname];
          recordAnomaly(spec, 'nonCanonicalRefs', link);
        }

        // At this point, we managed to associate the link with a shortname,
        // let's check whether the shortname matches a spec in the crawl,
        // matching the exact spec shortname if possible, or the series
        // shortname otherwise (in which case we'll use the current spec)
        const sourceSpec =
          edResults.find(s => s.shortname === shortname) ||
          edResults.find(s => s.series.shortname === shortname && s.series.currentSpecification === s.shortname);
        if (!sourceSpec) {
          if (!shortnameOfNonNormativeDocs.includes(shortname)) {
            recordAnomaly(spec, 'unknownSpecs', link);
          }
          return;
        }
        if (sourceSpec.error) {
          // no point in reporting an error on failed crawls
          return;
        }

        // Self-references might be broken because of ED vs TR, ignore that
        if (shortname === spec.shortname || shortname === spec.series.shortname) {
          return;
        }

        // Look for a corresponding entry in the TR crawl, which we'll use to
        // distinguish between broken links and "evolving" links (meaning links
        // that exist in the TR version but no longer exist in the ED)
        const trSourceSpec =
          trResults.find(s => s.shortname === shortname) ||
          trResults.find(s => s.series.shortname === shortname && s.series.currentSpecification === s.shortname) ||
          {};
        const headings = sourceSpec.headings || [];
        const dfns = sourceSpec.dfns || [];
        const ids = sourceSpec.ids || [];

        // Check anchors
        const anchors = spec.links.rawlinks[link].anchors || [];
        for (const anchor of anchors) {
          const baseLink = (sourceSpec.nightly?.url === link || sourceSpec.nightly?.pages?.includes(link)) ? link : sourceSpec.nightly?.url;
          const matchFullNightlyLink = matchAnchor(baseLink, anchor);
          const matchFullReleaseLink = matchAnchor((sourceSpec.release || sourceSpec.nightly).url, anchor);
          const isKnownId = ids.find(matchFullNightlyLink);
          const heading = headings.find(h => matchFullNightlyLink(h.href));
          const dfn = dfns.find(d => matchFullNightlyLink(d.href));
          if (!isKnownId) {
            if ((trSourceSpec.ids || []).find(matchFullReleaseLink) && link.match(/w3\.org\/TR\//)) {
              recordAnomaly(spec, 'evolvingLinks', link + '#' + anchor);
            } else {
              if (link.startsWith('https://html.spec.whatwg.org/C') || link.startsWith('http://html.spec.whatwg.org/C')) {
                recordAnomaly(spec, 'nonCanonicalRefs', link);
                link = link.replace('http:', 'https:').replace('https://html.spec.whatwg.org/C', 'https://html.spec.whatwg.org/multipage');
              }
              // Links to single-page version of HTML spec
              if (link === 'https://html.spec.whatwg.org/' &&
                  // is there an equivalent id in the multipage spec?
                  ids.find(i => i.startsWith('https://html.spec.whatwg.org/multipage/') &&
                    (i.endsWith('#' + anchor) || i.endsWith('#' + decodeURIComponent(anchor))))) {
                // Should we keep track of those? ignoring for now
              } else if (link.startsWith('https://html.spec.whatwg.org/multipage') && htmlFragments &&
                         htmlFragments[anchor] &&
                         ids.find(matchAnchor(`https://html.spec.whatwg.org/multipage/${htmlFragments[anchor]}.html`, anchor))) {
                // Deal with anchors that are JS-redirected from
                // the multipage version of HTML
                recordAnomaly(spec, 'frailLinks', link + '#' + anchor);
              } else if (anchor.startsWith(':~:text=')) {
                // links using text fragments are inherently fragile
                recordAnomaly(spec, 'frailLinks', link + '#' + anchor);
              } else {
                recordAnomaly(spec, 'brokenLinks', link + '#' + anchor);
              }
            }
          } else if (!heading && !dfn) {
            recordAnomaly(spec, 'notDfn', link + '#' + anchor);
          } else if (dfn && dfn.access !== 'public') {
            recordAnomaly(spec, 'notExported', link + '#' + anchor);
          }
        }
      });
  });
  return report;
}

/**************************************************
Export methods for use as module
**************************************************/
module.exports = { studyBackrefs };
