/**
 * Looks at draft issue files produced by the Strudy CLI in the issues folder
 * and submits new/updated/deleted ones as pull requests in this repo if there
 * is no pending pull request already.
*/
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from "node:url";
import { execSync } from 'node:child_process';
import matter from 'gray-matter';
import { Command, InvalidArgumentError } from 'commander';

/**
 * Command-line execution parameters for calls to `execSync`
 */
const scriptPath = path.dirname(fileURLToPath(import.meta.url));
const execParams = {
  cwd: path.join(scriptPath, '..', '..'),
  encoding: 'utf8'
};


/**
 * Wrap "matter" issue report to create a suitable PR body
 */
function prWrapper(action, issueReport) {
  switch (action) {
  case 'add':
    return `This pull request was automatically created by Strudy upon detecting errors in ${issueReport.data.Title}.

Please check that these errors were correctly detected, and that they have not already been reported in ${issueReport.data.Repo}.

If everything is OK, you can merge this pull request which will report the issue below to the repo, and update the underlying report file with a link to the said issue.

${issueReport.stringify()}
`;

  case 'update':
    return `This pull request was automatically created by Strudy upon detecting errors in ${issueReport.data.Title}.

Similar errors had already been detected. Please check that the diff is correct, and that the errors have not already been reported in ${issueReport.data.Repo}.

If everything is OK, you can merge this pull request which will report the issue below to the repo, and update the underlying report file with a link to the said issue.

${issueReport.stringify()}
`;

  case 'delete':
    return `This pull request was automatically created by Strudy while analyzing ${issueReport.data.Title}.

Please check that past errors listed below have indeed been corrected, and that the related issue in ${issueReport.data.Repo} has been closed accordingly.

If everything looks OK, you can merge this pull request to delete the issue file.

${issueReport.stringify()}
`;
  }
}

/**
 * Parse the maximum number of pull requests option as integer
 */
function myParseInt(value) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

const program = new Command();
program
  .description('File added/updated/deleted issue files as individual GitHub pull requests')
  .option('--dry-run', 'run the script without creating any actual pull request')
  .option('-m, --max <max>', 'maximum number of pull requests to create/update', myParseInt, 10)
  .showHelpAfterError('(run with --help for usage information)')
  .addHelpText('after', `
Minimal usage example:
  To create up to 10 pull requests from local issue files, run:
    $ node file-issue-for-review.js

Description:
  The command looks into the \`issues\` folder to find files that have been
  added, updated or deleted, and that have not yet been committed to the
  repository. For each of them, it creates a pull request on GitHub, unless one
  already exists.

  The \`gh\` and \`git\` CLI commands must be available and functional. The
  command will push Git updates to the \`origin\` remote, which must exist.

Usage notes for some of the options:
--dry-run
  Run the script without committing anything, and without creating any actual
  pull request. The option is meant for debugging.

-m, --max <max>
  Maximum number of pull requests to create. Defaults to 10.

  You may set the option to 0 to create as many pull requests as needed. You
  may want to check that there aren't too many pull requests to create first,
  though!
`)
  .action(async (options) => {
    function execOrLog(cmd) {
      options.dryRun ? console.log(cmd) : execSync(cmd, execParams);
    }

    if (options.dryRun) {
      console.log('DRY RUN!');
      console.log('The command won\'t make any actual change.');
    }
    console.log('How many pull requests can we use to change the world?');
    console.log(`- nb pull requests that we may create: ${options.max}`);

    console.log('On which Git branch are we?');
    const currentBranch = execSync('git branch --show-current', execParams).trim();
    console.log(`- current branch: ${currentBranch}`);

    // Possibly useful reminder about calls to `filter` below:
    // `split` on an empty string does not return an empty array!
    // Note several git commands can report the list of changes:
    // - `git diff` does not list files that need to be added
    // - `git ls-files` does not differentiate between "modified" and "deleted"
    // - `git status` lists everything and allows to detect situations where we
    // should back off because there are other types of pending changes in the
    // issues folder.
    console.log('How many issue files ought to be reported?');
    const toreport = execSync('git status --porcelain issues', execParams)
      .split('\n')
      .filter(x => !!x.trim())
      .map(line => {
        // All lines start with a two-letter state followed by a space and the
        // filename. For state values, see:
        // https://git-scm.com/docs/git-status#_short_format
        const match = line.match(/^(..) (.*)$/);
        if (!match) {
          throw new Error(`Unexpected line received when running "git status": "${line}"`);
        }
        const state = match[1];
        if (![' M', ' D', '??'].includes(state)) {
          throw new Error(`Unexpected state received when running "git status": "${line}"`);
        }
        const action =
          (state === '??') ? 'add' :
          (state === ' M') ? 'update' :
          'delete';
        return { action, filename: match[2].trim() };
      });
    console.log(`- nb issue files to report: ${toreport.length}`);
    if (toreport.length === 0) {
      console.log('No issue files to report');
      return;
    }

    let reported = 0;
    try {
      console.log('Create pull requests as needed...');
      for (const entry of toreport) {
        // Look for a related PR that may still be pending
        const issueMoniker = entry.filename.match(/^issues\/(.*)\.md$/)[1];
        const pendingPRStr = execSync(`gh pr list --head ${issueMoniker} --json number,headRefName`, execParams);
        const pendingPR = JSON.parse(pendingPRStr)[0];
        if (pendingPR) {
          console.log(`- skip ${entry.filename}, a pending PR already exists (#${pendingPR.number}`);
          continue;
        }

        let issueReport;
        if (entry.action === 'add') {
          issueReport = matter(await fs.readFile(entry.filename, 'utf-8'));
        }
        else {
          // File was deleted, retrieve its previous content from the HEAD
          issueReport = matter(await execSync(`git show HEAD:${entry.filename}`, execParams));
        }

        const actionLabel =
          (entry.action === 'add') ? 'File' :
          (entry.action === 'update') ? 'Update' :
          'Delete';
        console.log(`- create PR for ${entry.filename}`);
        // Note: always use the initial branch as starting point
        // otherwise commits made for files already reported would also be
        // copied to the new branch.
        execOrLog(`git checkout -b ${issueMoniker} ${currentBranch}`);
        execOrLog(`git add ${entry.filename}`);
        execOrLog(`git commit -m "${actionLabel} report on ${issueReport.data.Title}"`);
        execOrLog(`git push origin ${issueMoniker}`);

        const prBodyFile = path.join(execParams.cwd, '__pr.md')
        const prBody = prWrapper(entry.action, issueReport);
        await fs.writeFile(prBodyFile, prBody, 'utf8');
        try {
          execOrLog(`gh pr create --body-file __pr.md --title "${actionLabel} report on ${issueReport.data.Title.replace(/"/g, '')}"`);
        }
        finally {
          await fs.rm(prBodyFile, { force: true });
        }

        reported += 1;
        if (options.max > 0 && reported > options.max) {
          break;
        }
      }
    }
    finally {
      console.log(`- get back to the initial Git branch ${currentBranch}`);
      execOrLog(`git checkout ${currentBranch}`, execParams);
      console.log(`- nb PR ${options.dryRun ? 'that would be ' : ''}created: ${reported}`);
    }
  });

program.parseAsync(process.argv);