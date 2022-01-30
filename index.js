const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch').default
const cv = require('compare-versions');

module.exports = {}

function decodeBase64Content(base64) {
  const buffer = Buffer.from(base64.replace(/\n/g, ''), 'base64'); 
  const str = buffer.toString('ascii');
  return str;
}
async function getCurrentVersion(githubToken, owner, repo, verionFilePath, branch) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${verionFilePath}?ref=${branch}`, {
      headers: {
        'Authorization': 'Bearer ' + githubToken
      }
    });
    const json = await res.json();
    if (!json) return null;

    const version_json = JSON.parse(decodeBase64Content(json.content));
    return version_json.version;
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
    const branch = core.getInput('branch_name');

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const pr_num = github.context.issue.number;

    console.log('Using branch: ', branch);
    console.log('Using path to version.json: ', pathToVersion)
  
    const currentVersion = await getCurrentVersion(token, owner, repo, pathToVersion, branch);
    const prVersion = await getVersionFromPullRequest(token, owner, repo, pr_num);

    if (prVersion == null) {
      core.setFailed('No version.json found in pull request.')
      return null;
    }

    console.log(`Current version in ${pathToVersion} is: ${currentVersion}.`)
    console.log(`Current version in pull request version.json is: ${prVersion}`);

    const isGreater = cv.compare(prVersion, currentVersion, '>');
    if (!isGreater) {
      core.setFailed(`VERSION CONFLICT: ${branch}->version.json: ${currentVersion}. pull request-->version.json: ${prVersion}`);
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
