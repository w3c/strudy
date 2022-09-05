const requireFromWorkingDirectory = require('../lib/require-cwd');
const { expandCrawlResult } = require("reffy");
const fetch = require("node-fetch");

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
function computeShortname(url) {
  function parseUrl(url) {
    // Handle /TR/ URLs
    const w3cTr = url.match(/^https?:\/\/(?:www\.)?w3\.org\/TR\/([^\/]+)\/$/);
    if (w3cTr) {
      return w3cTr[1];
    }

    // Handle WHATWG specs
    const whatwg = url.match(/\/\/(.+)\.spec\.whatwg\.org\/?/);
    if (whatwg) {
        return whatwg[1];
    }

    // Handle TC39 Proposals
    const tc39 = url.match(/\/\/tc39\.es\/proposal-([^\/]+)\/$/);
    if (tc39) {
        return "tc39-" + tc39[1];
    }


    // Handle Khronos extensions
    const khronos = url.match(/https:\/\/registry\.khronos\.org\/webgl\/extensions\/([^\/]+)\/$/);
    if (khronos) {
        return khronos[1];
    }

    // Handle extension specs defined in the same repo as the main spec
    // (e.g. generate a "gamepad-extensions" name for
    // https://w3c.github.io/gamepad/extensions.html")
    const ext = url.match(/\/.*\.github\.io\/([^\/]+)\/(extensions?)\.html$/);
    if (ext) {
      return ext[1] + '-' + ext[2];
    }

    // Handle draft specs on GitHub, excluding the "webappsec-" prefix for
    // specifications developed by the Web Application Security Working Group
    const github = url.match(/\/.*\.github\.io\/(?:webappsec-)?([^\/]+)\//);
    if (github) {
        return github[1];
    }

    // Handle CSS WG specs
    const css = url.match(/\/drafts\.(?:csswg|fxtf|css-houdini)\.org\/([^\/]+)\//);
    if (css) {
      return css[1];
    }

    // Handle SVG drafts
    const svg = url.match(/\/svgwg\.org\/specs\/(?:svg-)?([^\/]+)\//);
    if (svg) {
      return "svg-" + svg[1];
    }

    // Return name when one was given
    if (!url.match(/\//)) {
      return url;
    }

    throw `Cannot extract meaningful name from ${url}`;
  }

  // Parse the URL to extract the name
  const name = parseUrl(url);

  // Make sure name looks legit, in other words that it is composed of basic
  // Latin characters (a-z letters, digits, underscore and "-"), and that it
  // only contains a dot for fractional levels at the end of the name
  // (e.g. "blah-1.2" is good but "blah.blah" and "blah-3.1-blah" are not)
  if (!name.match(/^[\w\-]+((?<=\-\d+)\.\d+)?$/)) {
    throw `Specification name contains unexpected characters: ${name} (extracted from ${url})`;
  }

  return name;
}


// shortnames for specs that should no longer be linked to
const shortNamesOfOutdatedSpecs = {
  "2dcontext": "html",
  "2dcontext2": "html",
  "cors":  "fetch",
  "custom-elements": "html",
  "domcore": "dom",
  "eventsource": "html",
  "html5": "html",
  "html50": "html",
  "html51": "html",
  "html52": "html",
  "selectors-api": "dom",
  "webmessaging": "html",
  "websockets": "html",
  "webstorage": "html",
  "workers": "html",
  "worklets-1": "html"
};

const shortnameMap = {
  "accname-1.1": "accname",
  "accname-aam-1.1": "accname",
  "BackgroundSync": "background-sync",
  "content-security-policy": "CSP",
  "core-aam-1.1": "core-aam",
  "csp": "CSP",
  "CSP2": "CSP",
  "css-selectors": "selectors",
  "css-selectors-3": "selectors",
  "css2": "CSS21",
  "css3-align": "css-align",
  "css3-animations": "css-animations",
  "css3-background": "css-backgrounds",
  "css3-box": "css-box",
  "css3-break": "css-break",
  "css3-color": "css-color",
  "css3-flexbox": "css-flexbox",
  "css3-fonts": "css-fonts",
  "css3-grid-layout": "css-grid",
  "css3-images": "css-images",
  "css3-mediaqueries": "mediaqueries",
  "css3-multicol": "css-multicol",
  "css3-namespace": "css-namespaces",
  "css3-page": "css-page",
  "css3-positioning": "css-position",
  "css3-regions": "css-regions",
  "css3-selectors": "selectors",
  "css3-speech": "css-speech",
  "css3-syntax": "css-syntax",
  "css3-text": "css-text",
  "css3-transforms": "css-transforms",
  "css3-transitions": "css-transitions",
  "css3-values": "css-values",
  "css3-writing-modes": "css-writing-modes",
  "feature-policy": "permissions-policy",
  "hr-time-2": "hr-time",
  "html-aam": "html-aam-1.0",
  "input-events-1": "input-events",
  "InputDeviceCapabilities": "input-device-capabilities",
  "IntersectionObserver": "intersection-observer",
  "mixedcontent": "mixed-content",
  "pointerevents2": "pointerevents",
  "powerfulfeatures": "secure-contexts",
  "resource-timing": "resource-timing-2",
  "resource-timing-1": "resource-timing",
  "ServiceWorker": "service-workers",
  "wai-aria-1.1": "wai-aria-1.2",
  "wasm-core-1": "wasm-core",
  "webauthn-1": "webauthn",
  "webdriver": "webdriver2",
  "webdriver1": "webdriver2"
};

// TODO: check the link is non-normative (somehow)
const shortnameOfNonNormativeDocs = [
  "accept-encoding-range-test",
  "aria-practices",
  "Audio-EQ-Cookbook",
  "books",
  "capability-urls",
  "clreq",
  "css-2017",
  "css-print",
  "css3-marquee",
  "css3-preslev",
  "design-principles",
  "discovery-api",
  "dpub-latinreq",
  "dpub-pagination",
  "file-system-api",
  "fingerprinting-guidance",
  "html-design-principles",
  "ilreq",
  "installable-webapps",
  "jlreq",
  "klreq",
  "media-accessibility-reqs",
  "media-source-testcoverage",
  "motion-sensors",
  "predefined-counter-styles",
  "rdf11-primer",
  "security-privacy-questionnaire",
  "security-questionnaire",
  "sensor-polyfills",
  "sensors",
  "sniffly",
  "spatial-navigation",
  "ssml-sayas",
  "storage-partitioning",
  "streamproc",
  "touch-events-extensions",
  "typography",
  "using-aria",
  "wai-aria-implementation",
  "wai-aria-practices",
  "wai-aria-practices-1.1",
  "wai-aria-practices-1.2",
  "wai-aria-roadmap",
  "wake-lock-use-cases",
  "web-audio-perf",
  "web-intents",
  "webaudio-usecases",
  "webdatabase",
  "webrtc-interop-reports",
  "webrtc-nv-use-cases"
];

async function loadCrawlResults(edCrawlResultsPath, trCrawlResultsPath) {
  let edCrawlResults, trCrawlResults;
  try {
    edCrawlResults = requireFromWorkingDirectory(edCrawlResultsPath);
  } catch(e) {
    throw "Impossible to read " + edCrawlResultsPath + ": " + e;
  }
  try {
    trCrawlResults = requireFromWorkingDirectory(trCrawlResultsPath);
  } catch(e) {
    throw "Impossible to read " + trCrawlResultsPath + ": " + e;
  }

  edCrawlResults = await expandCrawlResult(edCrawlResults, edCrawlResultsPath.replace(/index\.json$/, ''));
  trCrawlResults = await expandCrawlResult(trCrawlResults, trCrawlResultsPath.replace(/index\.json$/, ''));

  return {
    ed: edCrawlResults.results,
    tr: trCrawlResults.results
  };
}


async function studyBackrefs(edResults, trResults = []) {
  trResults = trResults || [];
  const report = {};

  // Donwload automatic map of multipages anchors in HTML spec
  // FIXME: this makes the script network-dependent
  const htmlFragments = await fetch("https://html.spec.whatwg.org/multipage/fragment-links.json").then(r => r.json());

  function recordAnomaly(spec, anomalyType, link) {
    if (!report[spec.url]) {
      report[spec.url] = {
        title: spec.title,
	crawled: spec.crawled,
	shortname: spec.shortname,
	repo: spec.nightly.repository,
        notExported: [],
        notDfn: [],
        brokenLinks: [],
	frailLinks: [],
        evolvingLinks: [],
        outdatedSpecs: [],
        unknownSpecs: [],
        datedUrls: [],
	crawlError: [],
      };
    }
    report[spec.url][anomalyType].push(link);
  }

  edResults.forEach(spec => {
    Object.keys(spec.links || {})
      .filter(matchSpecUrl)
      .forEach(link => {
        let shortname;
	if (spec.links[link].specShortname) {
	  shortname = spec.links[link].specShortname;
	} else {
          let nakedLink = link;
          if (nakedLink.endsWith(".html")) {
            nakedLink = nakedLink.replace(/\/(Overview|overview|index)\.html$/, '/');
          }
          if (nakedLink[nakedLink.length - 1] !== '/') {
            nakedLink += '/';
          }

          // Detect links to dated specs
          const match = nakedLink.match(/www\.w3\.org\/TR\/[0-9]{4}\/[A-Z]+-(.+)-[0-9]{8}\//);
          if (match) {
            // ED should not link to dated versions of the spec, unless it
            // voluntarily links to previous versions of itself
            if (match[1] !== spec.shortname) {
              recordAnomaly(spec, "datedUrls", link);
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
              r.nightly.url === nakedLink ||
              (r.series && nakedLink === `https://www.w3.org/TR/${r.series.shortname}/`) ) || {}).shortname;

          // If it does not match any known URL, try to compute a shortname out of
          // it directly.
          if (!shortname) {
            try {
              shortname = computeShortname(nakedLink);
            }
            catch (e) {
              recordAnomaly(spec, "unknownSpecs", link);
              return;
            }
          }
	}

        if (shortNamesOfOutdatedSpecs[shortname]) {
          // The specification should no longer be referenced.
          // In theory, we could still try to match the anchor against the
          // right spec. In practice, these outdated specs are sufficiently
          // outdated that it does not make a lot of sense to do so.
          recordAnomaly(spec, "outdatedSpecs", link);
          return;
        }

        if (shortnameMap[shortname]) {
          // TODO: Consider reporting that as a "non ideal" link.
          shortname = shortnameMap[shortname];
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
            recordAnomaly(spec, "unknownSpecs", link);
          }
          return;
        }
	if (sourceSpec.error) {
	  // no point in reporting an error on failed crawls
	  recordAnomaly(spec, "crawlError", link);
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
        const anchors = spec.links[link].anchors || [];
        for (let anchor of anchors) {
	  const baseLink = (sourceSpec.nightly.url === link || sourceSpec.nightly?.pages?.includes(link)) ? link : sourceSpec.nightly.url;
	  const fullNightlyLink = baseLink + "#" + anchor;
	  const fullReleaseLink = (sourceSpec.release || sourceSpec.nightly).url + "#" + anchor;
          const isKnownId = ids.includes(fullNightlyLink);
          const heading = headings.find(h => h.href === fullNightlyLink);
          const dfn = dfns.find(d => d.href === fullNightlyLink);
          if (!isKnownId) {
            if ((trSourceSpec.ids || []).includes(fullReleaseLink) && link.match(/w3\.org\/TR\//)) {
              recordAnomaly(spec, "evolvingLinks", link + "#" + anchor);
            } else {
	      // Links to single-page version of HTML spec
	      if (link === "https://html.spec.whatwg.org/"
		  // is there an equivalent id in the multipage spec?
		  && ids.find(i => i.match(new RegExp("https://html\.spec\.whatwg\.org/multipage/(.*)\.html#" + anchor)))) {
		    // Should we keep track of those? ignoring for now
	      } else if (link === "https://html.spec.whatwg.org/multipage/"
		  && htmlFragments[anchor]
			 && ids.includes(`https://html.spec.whatwg.org/multipage/${htmlFragments[anchor]}.html#${anchor}`)) {
		// Deal with anchors that are JS-redirected from
		// the multipage version of HTML
		recordAnomaly(spec, "frailLinks", link + "#" + anchor);
	      } else {
		recordAnomaly(spec, "brokenLinks", link + "#" + anchor);
	      }
            }
          } else if (!heading && !dfn) {
            recordAnomaly(spec, "notDfn", link + "#" + anchor);
          } else if (dfn && dfn.access !== "public") {
            recordAnomaly(spec, "notExported", link  + "#" + anchor);
          }
        }
      });
  });
  return report;
}

/**************************************************
Export methods for use as module
**************************************************/
module.exports = { studyBackrefs, loadCrawlResults };
