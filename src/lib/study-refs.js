import { loadCrawlResults, recordCategorizedAnomaly } from './util.js';
import { fileURLToPath } from 'node:url';

const possibleAnomalies = [
  'discontinuedReferences'
];

function studyReferences (edResults) {
  const report = [];
  const recordAnomaly = recordCategorizedAnomaly(report, 'refs', possibleAnomalies);
  edResults.forEach(spec => {
    (spec.refs?.normative || []).forEach(ref => {
      const referencedSpec = edResults.find(s => s.url === ref.url || s?.nightly?.url === ref.url || s?.nightly?.alternateUrls?.includes(ref.url));

      if (referencedSpec && referencedSpec.standing === "discontinued") {

	const newSpecsLinks = edResults.filter(s => referencedSpec.obsoletedBy?.includes(s.shortname)).map(s => `[${s.shortname}](${s?.nightly?.url || s.url})`);
	recordAnomaly(spec, 'discontinuedReferences', `[${ref.name}](${ref.url}) ${newSpecsLinks.length ? `has been obsoleted by ${newSpecsLinks}` : `is discontinued, no known replacement reference`}`);
      }
    });
  });
  return report;
}

export default studyReferences;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const crawl = await loadCrawlResults(process.argv[2]);
  const results = studyReferences(crawl.ed);
  console.log(results);
}
