const { recordCategorizedAnomaly } = require('./util');

const possibleAnomalies = [
  'discontinuedReferences'
];

function studyReferences (edResults) {
  const report = [];
  const recordAnomaly = recordCategorizedAnomaly(report, 'refs', possibleAnomalies);
  edResults.forEach(spec => {
    (spec.refs?.normative || []).forEach(ref => {
      const referencedSpec = edResults.find(s => s.url === ref.url || s?.nightly.url === ref.url || s?.nightly?.alternateUrls?.includes(ref.url));

      if (referencedSpec && referencedSpec.standing === "discontinued") {

	const newSpecsLinks = edResults.filter(s => referencedSpec.obsoletedBy?.includes(s.shortname)).map(s => `[${s.shortname}](${s?.nightly.url || s.url})`);
	recordAnomaly(spec, 'discontinuedReferences', `[${ref.name}](${ref.url}) ${newSpecsLinks.length ? `has been obsoleted by ${newSpecsLinks}` : `is discontinued, no known replacement reference`}`);
      }
    });
  });
  return report;
}

module.exports = { studyReferences };

if (require.main === module) {
  (async function() {
    const { loadCrawlResults } = require('../lib/util');
    const crawl = await loadCrawlResults(process.argv[2]);
    const results = studyReferences(crawl.ed);
    console.log(results);
  })();
}
