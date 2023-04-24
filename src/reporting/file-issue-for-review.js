/* Takes a report of anomalies produced by Strudy,
   creates a draft of an issue per spec and per anomaly type
   and submits as a pull request in this repo if no existing one matches
*/
const { loadCrawlResults } = require('../lib/util');
const { studyBackrefs } = require('../lib/study-backrefs');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');
const Octokit = require('../lib/octokit');
const matter = require('gray-matter');
const fetch = require('node-fetch');

const GH_TOKEN = (() => {
  try {
    return require('../../config.json').GH_TOKEN;
  } catch (err) {
    return process.env.GH_TOKEN;
  }
})();

const MAX_PR_BY_RUN = 10;

const repoOwner = 'w3c';
const repoName = 'strudy';

const octokit = new Octokit({
  auth: GH_TOKEN
  // log: console
});

// based on `jq .[].nightly.repository index.json |sort|uniq -c|sort -rn|less`
// in browser-specs
// TODO: automate it?
const multiSpecRepos = ['w3c/csswg-drafts', 'w3c/fxtf-drafts', 'w3c/svgwg', 'KhronosGroup/WebGL', 'httpwg/httpwg.github.io', 'w3c/css-houdini-drafts', 'WebAssembly/spec', 'w3c/woff', 'w3c/mediacapture-handle', 'w3c/epub-specs', 'gpuweb/gpuweb'].map(r => 'https://github.com/' + r);

function issueWrapper (spec, anomalies, anomalyType) {
  const titlePrefix = (multiSpecRepos.includes(spec.nightly.repository)) ? `[${spec.shortname}] ` : '';
  let anomalyReport = ''; let title = '';
  switch (anomalyType) {
    case 'brokenLinks':
      title = `Broken references in ${spec.title}`;
      anomalyReport = 'the following links to other specifications were detected as pointing to non-existing anchors';
      break;
    case 'outdatedSpecs':
      title = `Outdated references in ${spec.title}`;
      anomalyReport = 'the following links were detected as pointing to outdated specifications';
      break;
    case 'nonCanonicalRefs':
      title = `Non-canonical references in ${spec.title}`;
      anomalyReport = 'the following links were detected as pointing to outdated URLs';
      break;
  }
  return {
    title: titlePrefix + title,
    content: `
While crawling [${spec.title}](${spec.crawled}), ${anomalyReport}:
${anomalies.map(anomaly => `* [ ] ${anomaly.message}`).join('\n')}

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>`
  };
}

function prWrapper (title, uri, repo, issueReport) {
  return `This pull request was automatically created by Strudy upon detecting errors in ${title}.

Please check that these errors were correctly detected, and that they have not already been reported in ${repo}.

If everything is OK, you can merge this pull request which will report the issue below to the repo, and update the underlying report file with a link to the said issue.

${issueReport}
`;
}

if (require.main === module) {
  const knownAnomalyTypes = ['brokenLinks', 'outdatedSpecs', 'nonCanonicalRefs'];

  let edCrawlResultsPath = process.argv[2];
  let trCrawlResultsPath = process.argv[3];
  const anomalyFilter = process.argv.slice(4).filter(p => !p.startsWith('--'));
  const unknownAnomalyType = anomalyFilter.find(p => !knownAnomalyTypes.includes(p));
  if (unknownAnomalyType) {
    console.error(`Unknown report type ${unknownAnomalyType} - known types are ${knownAnomalyTypes.join(', ')}`);
    process.exit(1);
  }
  const anomalyTypes = anomalyFilter.length ? anomalyFilter : knownAnomalyTypes;
  const updateMode = process.argv.includes('--update') ? 'update-untracked' : (process.argv.includes('--update-tracked') ? 'update-tracked' : false);
  const dryRun = process.argv.includes('--dry-run');
  const noGit = dryRun || updateMode || process.argv.includes('--no-git');

  if (!noGit && !GH_TOKEN) {
    console.error('GH_TOKEN must be set to some personal access token as an env variable or in a config.json file');
    process.exit(1);
  }

  // Target the index file if needed
  if (!edCrawlResultsPath.endsWith('index.json')) {
    edCrawlResultsPath = path.join(edCrawlResultsPath, 'index.json');
  }
  if (!trCrawlResultsPath.endsWith('index.json')) {
    trCrawlResultsPath = path.join(trCrawlResultsPath, 'index.json');
  }
  (async function () {
    let existingReports = [];
    if (updateMode) {
      console.log('Compiling list of relevant existing issue reports…');
      // List all existing reports to serve as a comparison point
      // to detect if any report can be deleted
      // if the anomalies are no longer reported
      const reportFiles = (await fs.readdir('issues')).map(p => 'issues/' + p);
      for (const anomalyType of anomalyTypes) {
        existingReports = existingReports.concat(reportFiles.filter(p => p.endsWith(`-${anomalyType.toLowerCase()}.md`)));
      }
      console.log('- done');
    }
    const nolongerRelevantReports = new Set(existingReports);

    // Donwload automatic map of multipages anchors in HTML spec
    let htmlFragments = {};
    try {
      console.log('Downloading HTML spec fragments data…');
      htmlFragments = await fetch('https://html.spec.whatwg.org/multipage/fragment-links.json').then(r => r.json());
      console.log('- done');
    } catch (err) {
      console.log('- failed: could not fetch HTML fragments data, may report false positive broken links on HTML spec');
    }

    console.log(`Opening crawl results ${edCrawlResultsPath} and ${trCrawlResultsPath}…`);
    const crawl = await loadCrawlResults(edCrawlResultsPath, trCrawlResultsPath);
    console.log('- done');
    console.log('Running back references analysis…');
    const results = studyBackrefs(crawl.ed, crawl.tr, htmlFragments);
    console.log('- done');
    const currentBranch = noGit || execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const needsPush = {};
    for (const anomalyType of anomalyTypes) {
      const anomalies = results.filter(r => r.name === anomalyType);
      const specs = [...new Set(anomalies.map(a => a.specs.map(s => s.url)).flat())];
      for (const url of specs) {
        const specAnomalies = anomalies.filter(a => a.specs[0].url === url);
        const spec = specAnomalies[0].specs[0];
        console.log(`Compiling ${anomalyType} report for ${spec.title}…`);
        // if we don't know the repo, we can't file an issue
        if (!spec.nightly.repository) {
          console.log(`No known repo for ${spec.title}, skipping`);
          continue;
        }
        const issueMoniker = `${spec.shortname}-${anomalyType.toLowerCase()}`;
        // is there already a file with that moniker?
        const issueFilename = path.join('issues/', issueMoniker + '.md');
        let tracked = 'N/A';
        let existingReportContent;
        try {
          if (!(await fs.stat(issueFilename)).isFile()) {
            console.error(`${issueFilename} already exists but is not a file`);
            continue;
          } else {
            if (!updateMode) {
              console.log(`${issueFilename} already exists, bailing`);
              continue;
            } else {
              nolongerRelevantReports.delete(issueFilename);
              try {
                const existingReport = matter(await fs.readFile(issueFilename, 'utf-8'));
                tracked = existingReport.data.Tracked;
                existingReportContent = existingReport.content;
                // only update tracked or untracked reports based on
                // CLI parameter
                if ((updateMode === 'update-untracked' && tracked !== 'N/A') || (updateMode === 'update-tracked' && tracked === 'N/A')) {
                  continue;
                }
              } catch (e) {
                console.error('Failed to parse existing content', e);
                continue;
              }
            }
          }
        } catch (err) {
          // Intentionally blank
        }
        // if not, we create the file, add it in a branch
        // and submit it as a pull request to the repo
        const { title, content: issueReportContent } = issueWrapper(spec, specAnomalies, anomalyType);
        if (updateMode) {
          if (existingReportContent) {
            const existingAnomalies = existingReportContent.split('\n').filter(l => l.startsWith('* [ ] ')).map(l => l.slice(6));
            if (existingAnomalies.every((a, i) => specAnomalies[i] === a) && existingAnomalies.length === specAnomalies.length) {
              // no substantial change, skip
              console.log(`Skipping ${title}, no change`);
              continue;
            }
          } else {
            // in update mode, we only care about existing reports
            continue;
          }
        }
        const issueReportData = matter(issueReportContent);
        issueReportData.data = {
          Repo: spec.nightly.repository,
          Tracked: tracked,
          Title: title
        };
        let issueReport;
        try {
          issueReport = issueReportData.stringify();
        } catch (err) {
          console.error(`Failed to stringify report of ${anomalyType} for ${title}: ${err}`, issueReportContent);
          continue;
        }
        if (dryRun) {
          console.log(`Would add ${issueFilename} with`);
          console.log(issueReport);
          console.log();
        } else {
          await fs.writeFile(issueFilename, issueReport, 'utf-8');
          try {
            if (!noGit) {
              console.log(`Committing issue report as ${issueFilename} in branch ${issueMoniker}…`);
              execSync(`git checkout -b ${issueMoniker}`);
              execSync(`git add ${issueFilename}`);
              execSync(`git commit -m "File report on ${issueReportData.data.Title}"`);
              needsPush[issueMoniker] = { title: issueReportData.data.Title, report: issueReport, repo: spec.nightly.repository, specTitle: spec.title, uri: spec.crawled };
              console.log('- done');
              execSync(`git checkout ${currentBranch}`);
            }
          } catch (err) {
            console.error(`Failed to commit error report for ${spec.title}`, err);
            await fs.unlink(issueFilename);
            execSync(`git checkout ${currentBranch}`);
          }
        }
      }
    }
    if (nolongerRelevantReports.size) {
      console.log('The following reports are no longer relevant, deleting them', [...nolongerRelevantReports]);
      for (const issueFilename of nolongerRelevantReports) {
        await fs.unlink(issueFilename);
      }
    }
    if (Object.keys(needsPush).length) {
      let counter = 0;
      for (const branch in needsPush) {
        if (counter > MAX_PR_BY_RUN) {
          delete needsPush[branch];
          continue;
        }

        // is there already a pull request targetting that branch?
        const { data: pullrequests } = (await octokit.rest.pulls.list({
          owner: repoOwner,
          repo: repoName,
          head: `${repoOwner}:${branch}`
        }));
        if (pullrequests.length > 0) {
          console.log(`A pull request from branch ${branch} already exists, bailing`);
          delete needsPush[branch];
        }
        counter++;
      }
    }
    if (Object.keys(needsPush).length) {
      console.log(`Pushing new branches ${Object.keys(needsPush).join(' ')}…`);
      execSync(`git push origin ${Object.keys(needsPush).join(' ')}`);
      console.log('- done');
      for (const branch in needsPush) {
        const { title, specTitle, uri, repo, report } = needsPush[branch];
        console.log(`Creating pull request from branch ${branch}…`);
        await octokit.rest.pulls.create({
          owner: repoOwner,
          repo: repoName,
          title,
          body: prWrapper(specTitle, uri, repo, report),
          head: `${repoOwner}:${branch}`,
          base: 'main'
        });
        console.log('- done');
      }
    }
  })();
}
