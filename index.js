const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch').default
const cv = require('compare-versions');

module.exports = {}

async function getCurrentVersion(githubToken, owner, repo, verionFilePath) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${verionFilePath}`, {
      headers: {
        'Authorization': 'Bearer ' + githubToken
      }
    });
    const json = await res.json();
    console.log({json});
    return json.version;
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getVersionFromPullRequest(githubToken, owner, repo, pull_number) {
  try {
    const octokit = github.getOctokit(githubToken);
    const { data } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number
    })

    const version_file_ref = data.find(x => x.filename == 'version.json');

    if (!version_file_ref) return null;

    const res = await fetch(version_file_ref.raw_url);
    const version_json = await res.json();

    return version_json.version;

  } catch (error) {
    core.setFailed(error.message);
  }
}

async function run() {
  try {
    const pathToVersion = core.getInput('version-json-path')
    const token = core.getInput('github-token');

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const pr_num = github.context.issue.number;
    const branch = github.context.ref;

    console.log('owner: ', owner);
    console.log('repo:', repo);
    console.log('pr_num:', pr_num);

    // todo. Test if this is the actual branch name
    console.log('branch name', github.context);
  
    const currentVersion = await getCurrentVersion(token, owner, repo, pathToVersion);
    const prVersion = await getVersionFromPullRequest(token, owner, repo, pr_num);

    if (prVersion == null) {
      core.setFailed('No version.json found in pull request.')
      return null;
    }

    console.log(`Current version in ${pathToVersion} is: ${currentVersion}.`)
    console.log(`Current version in pull request version.json is: ${prVersion}`);

    const isGreater = cv.compare(prVersion, currentVersion, '>');
    if (!isGreater) {
      core.setFailed(`current version: ${currentVersion}. pr version: ${prVersion}`);
      return isGreater;
    }
    return isGreater;
  } catch (error) {
    core.setFailed(error.message);
  }
}

global.is_testing !== true && run();

// used for testing
module.exports.run = run;
