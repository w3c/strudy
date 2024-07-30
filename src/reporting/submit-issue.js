/* Submits issue reports merged in the repository as issue on the relevant repo
   and documents the said GitHub issue in the issue report.
   Can also be called on a specific issue report (typicall when it gets merged in)
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import { execSync } from 'child_process';
import Octokit from '../lib/octokit.js';
import loadJSON from '../lib/load-json.js';

const config = await loadJSON("config.json");
const GH_TOKEN = config?.GH_TOKEN ?? process.env.GH_TOKEN;

const octokit = new Octokit({
  auth: GH_TOKEN
  // log: console
});

const targetIssueReport = process.argv[2];
let issuesToSubmit = [];
execSync('git pull origin main');
if (targetIssueReport) {
  try {
    if ((await fs.stat(targetIssueReport)).isFile()) {
      issuesToSubmit.push(targetIssueReport);
    } else {
      console.error(`${targetIssueReport} is not a file`);
      process.exit(2);
    }
  } catch (err) {
    console.error(`${targetIssueReport} does not exist`);
    process.exit(2);
  }
} else {
  issuesToSubmit = (await fs.readdir('issues')).filter(p => p.endsWith('.md')).map(p => 'issues/' + p);
}
let needsCommit = false;
for (const filename of issuesToSubmit) {
  const issueReport = await fs.readFile(filename, 'utf-8');
  const issueData = matter(issueReport);
  const { data: metadata, content: body } = issueData;
  if (!(metadata?.Repo && metadata?.Tracked && metadata?.Title && body)) {
    console.error(`Could not parse expected data from ${filename}.`, JSON.stringify(issueData, null, 2));
    continue;
  }
  if (metadata.Tracked !== 'N/A') {
    console.log(`Issue report ${filename} already filed as ${metadata.Tracked}.`);
    continue;
  }
  const m = metadata.Repo.match(/https:\/\/github\.com\/([^/]*)\/([^/]*)\/?$/);
  if (!m) {
    console.error(`Cannot parse ${metadata.Repo} as a github repository url.`);
    continue;
  }
  const [, owner, repo] = m;
  console.log(`Submitting issue ${metadata.Title}…`);
  const ghRes = await octokit.rest.issues.create({
    owner,
    repo,
    title: metadata.Title,
    body
  });
  const issueUrl = ghRes?.data?.html_url;
  console.log(`- filed ${issueUrl}`);
  if (issueUrl) {
    execSync('git pull origin main');
    console.log(`Saving updated report to ${filename}`);
    metadata.Tracked = issueUrl;
    await fs.writeFile(filename, issueData.stringify(), 'utf-8');
    console.log(issueData.stringify());
    execSync(`git add -u ${filename}`);
    needsCommit = true;
  }
}
if (needsCommit) {
  execSync('git commit -m "Update issue reports with github issue ref"');
  execSync('git push origin main');
}
