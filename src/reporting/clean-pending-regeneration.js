/**
 * Check GitHub pull requests labeled "pending-spec-regeneration"
 * and close them if the relevant spec has been regenerated
 * since the PR was created.
 */

const core = require('@actions/core');
const Octokit = require('../lib/octokit');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { loadCrawlResults } = require('../lib/util');

const owner = 'w3c';
const repo = 'strudy';



/**
 * Check GitHub issues and PR referenced by patch files and drop patch files
 * that only reference closed issues and PR.
 *
 * @function
 * @return {String} A GitHub flavored markdown string that describes what
 *   patches got dropped and why. To be used in a possible PR. Returns an
 *   empty string when there are no patches to drop.
 */
async function dropPendingReportsWhenPossible (edCrawlResultsPath) {
  // Find PRs labeled pending-spec-regenetation
  const { data: issues } = (await octokit.rest.issues.listForRepo({
    owner,
    repo,
    labels: "pending-spec-regeneration"
  }));

  const pull_requests = issues.filter(i => i.pull_request);
  if (!pull_requests.length) {
    console.log("No open pull requests labeled pending-spec-regeneration");
    return [];
  }
  const crawl = await loadCrawlResults(edCrawlResultsPath);

  const dropped = [];
  for (const pr of pull_requests) {
    // find relevant spec URL from issue body (the first markdown link there)
    const m = pr.body.match(/\]\(([^\)]+)\)/);
    if (!m) {
      console.error(`Could not find link to spec in body of PR ${pr.number}, aborting`);
      continue;
    }
    const url = m[1];
    const spec = crawl.ed.find(s => s.nightly?.url === url);
    if (!spec) {
      console.error(`Could not find ${url} in webref crawl data, aborting`);
      continue;
    }
    const lastModified = new Date(spec.crawlCacheInfo.lastModified);
    // check if the last modified date in webref is later than the PR creation
    if (lastModified.toJSON() > pr.created_at) {
      console.log(`PR ${pr.number} may no longer be relevant, closing it`);
      // if it is, delete the branch, and close the PR
      const prData = await octokit.rest.pulls.get({
	owner,
	repo,
	pull_number: pr.number
      });
      await octokit.rest.git.deleteRef({
	owner,
	repo,
	ref: prData.head.ref
      });
      await octokit.rest.issues.update({
	owner,
	repo,
	issue_number: pr.number,
	state: "closed"
      });
      dropped.push(pr.pull_request.html_url);
    }
  }
  return dropped;
}

/*******************************************************************************
Retrieve GH_TOKEN from environment, prepare Octokit and kick things off
*******************************************************************************/
const GH_TOKEN = (() => {
  try {
    return require('../../config.json').GH_TOKEN;
  } catch {
    return process.env.GH_TOKEN;
  }
})();
if (!GH_TOKEN) {
  console.error('GH_TOKEN must be set to some personal access token as an env variable or in a config.json file');
  process.exit(1);
}

const octokit = new Octokit({
  auth: GH_TOKEN
  // log: console
});

let edCrawlResultsPath = process.argv[2];

if (!edCrawlResultsPath) {
  console.error('Path to the webref crawl of editors draft needs to be provided as argument');
  process.exit(1);
}

// Target the index file if needed
if (!edCrawlResultsPath.endsWith('index.json')) {
  edCrawlResultsPath = path.join(edCrawlResultsPath, 'index.json');
}


dropPendingReportsWhenPossible(edCrawlResultsPath)
  .then(res => {
    core.exportVariable('dropped_reports', res);
    console.log();
    console.log('Set dropped_reports env variable');
    console.log(res);
    console.log('== The end ==');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
