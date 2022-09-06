/* Takes a report of anomalies produced by Strudy,
   creates a draft of an issue per spec and per anomaly type
   and submits as a pull request in this repo if no existing one matches
*/
const {studyBackrefs, loadCrawlResults} = require("../lib/study-backrefs");
const path = require("path");
const fs = require("fs").promises;
const { execSync } = require('child_process');
const Octokit = require("../lib/octokit");

const GH_TOKEN = (() => {
  try {
    return require("../config.json").GH_TOKEN;
  } catch (err) {
    return process.env.GH_TOKEN;
  }
})();

const MAX_PR_BY_RUN = 10;

const repoOwner = 'w3c';
const repoName = 'strudy';

if (!GH_TOKEN) {
  console.error("GH_TOKEN must be set to some personal access token as an env variable or in a config.json file");
  process.exit(1);
}

const octokit = new Octokit({
  auth: GH_TOKEN,
  //log: console
});

function prWrapper(title, uri, repo, issueReport) {
  return `This pull request was automatically created by Strudy upon detecting errors in ${title}.

Please check that these errors were correctly detected, and that they have not already been reported in ${repo}.

If everything is OK, you can merge this pull request which will report the issue below to the repo, and update the underlying report file with a link to the said issue.

${issueReport}
`;
}

if (require.main === module) {
  let edCrawlResultsPath = process.argv[2];
  let trCrawlResultsPath = process.argv[3];
  // Target the index file if needed
  if (!edCrawlResultsPath.endsWith('index.json')) {
    edCrawlResultsPath = path.join(edCrawlResultsPath, 'index.json');
  }
  if (!trCrawlResultsPath.endsWith('index.json')) {
    trCrawlResultsPath = path.join(trCrawlResultsPath, 'index.json');
  }
  (async function() {
    console.log(`Opening crawl results ${edCrawlResultsPath} and ${trCrawlResultsPath}…`)
    const crawl = await loadCrawlResults(edCrawlResultsPath, trCrawlResultsPath);
    console.log("- done");
    console.log("Running broken link detection…");
    const results = await studyBackrefs(crawl.ed, crawl.tr);
    console.log("- done");
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    let counter = 0;
    const needsPush = {};
    await Promise.all(Object.keys(results).map(async uri => {
      const specResult = results[uri];
      console.log(`Compiling report for ${specResult.title}…`);
      const brokenLinks = specResult.brokenLinks || [];
      if (brokenLinks.length) {

	if (counter > MAX_PR_BY_RUN) return;
	const issueMoniker = `${specResult.shortname}-brokenlinks`;
	// is there already a file with that moniker?
	const issueFilename = path.join('issues/', issueMoniker + '.md');
	try {
	  if (!(await fs.stat(issueFilename)).isFile()) {
	    console.error(`${issueFilename} already exists but is not a file`);
	  } else {
	    console.log(`${issueFilename} already exists, bailing`);
	  }
	  return;
	} catch (err) {
	  // Intentionally blank
	}
	// if not, we create the file, add it in a branch
	// and submit it as a pull request to the repo
	const issueReport = `---
Repo: ${specResult.repo}
Tracked: N/A
Title: Broken references in ${specResult.title}

---

While crawling [${specResult.title}](${specResult.crawled}), the following links to other specifications were detected as pointing to non-existing anchors, which should be fixed:
${brokenLinks.map(link => `* [ ] ${link}`).join("\n")}

<sub>This issue was detected and reported semi-automatically by [Strudy](https://github.com/w3c/strudy/) based on data collected in [webref](https://github.com/w3c/webref/).</sub>`;
	await fs.writeFile(issueFilename, issueReport, 'utf-8');
	try {
	  console.log(`Committing issue report as ${issueFilename} in branch ${issueMoniker}…`);
	  execSync(`git checkout -b ${issueMoniker}`);
	  execSync(`git add ${issueFilename}`);
	  execSync(`git commit -m "File report on broken links found in ${specResult.title}"`);
	  needsPush[issueMoniker] = {title: `Broken references in ${specResult.title}`, report: issueReport, repo: specResult.repo, specTitle: specResult.title, uri: specResult.crawled, repo: specResult.repo};
	  counter++;
	  console.log("- done");
	  execSync(`git checkout ${currentBranch}`);
	} catch (err) {
	  console.error(`Failed to commit error report for ${specResult.title}`, err);
	  fs.unlink(issueFilename);
	  execSync(`git checkout ${currentBranch}`);
	}
      }
    }));
    if (Object.keys(needsPush).length) {
      for (let branch in needsPush) {
        // is there already a pull request targetting that branch?
        const {data: pullrequests} = (await octokit.rest.pulls.list({
        owner: repoOwner,
        repo: repoName,
        head: `${repoOwner}:${branch}`
        }));
        if (pullrequests.length > 0) {
          console.log(`A pull request from branch ${branch} already exists, bailing`);
          delete needsPush[branch];
        }
      }
    }
    if (Object.keys(needsPush).length) {
      console.log(`Pushing new branches ${Object.keys(needsPush).join(' ')}…`);
      execSync(`git push origin ${Object.keys(needsPush).join(' ')}`);
      console.log("- done");
      for (let branch in needsPush) {
	const {title, specTitle, uri, repo, report} = needsPush[branch];
	console.log(`Creating pull request from branch ${branch}…`);
	await octokit.rest.pulls.create({
	  owner: repoOwner,
	  repo: repoName,
	  title,
	  body: prWrapper(specTitle, uri, repo, report),
	  head: `${repoOwner}:${branch}`,
	  base: 'main',
	});
	console.log("- done");
      }
    }
  })();
}
