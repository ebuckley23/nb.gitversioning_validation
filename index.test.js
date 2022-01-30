import 'regenerator-runtime/runtime';

const CURRENT_REPO_URL = 'begin:https://api.github';
const PR_REPO_URL = 'begin:https://github';
const PASSED_VERSION_CHECK = true;
const FAILED_VERSION_CHECK = false;

const DEFAULT_GITHUB_CONTEXT = {
  repo: {
    owner: 'ebuckley23',
    repo: 'j789'
  },
  issue: {
    number: 1
  }
}

const mockOctokitResponse = {
  data: [{
    filename: 'version.json',
    raw_url: 'https://github.com'
  }]
}
const mockOctokit = {
  rest: {
    pulls: {
      listFiles: jest.fn(() => mockOctokitResponse)
    }
  }
}
jest.mock('@actions/github', () => ({
  context: DEFAULT_GITHUB_CONTEXT,
  getOctokit: jest.fn(() => mockOctokit)
}));

jest.mock('node-fetch', () => require('fetch-mock')
  .sandbox());

import fetch from 'node-fetch';
import validation from './index';
const core = require('@actions/core');

describe('nb.gitversioning_validation run()', () => {
  beforeEach(() => {
    jest.resetModules();
    fetch.restore();
  });
  
  it('passes validation when major version of pr version.json is > than major version of current version.json', async () => {
    fetch
      .mock(CURRENT_REPO_URL, { version: '1.2.9' })
      .mock(PR_REPO_URL, { version: '2.0.2' });

    core.getInput = jest.fn().mockImplementation((x) => {
      if (x === 'version-json-path') return 'version.json';
      return 'fake-token';
    });
    const result = await validation.run();
    expect(result).toBe(PASSED_VERSION_CHECK);
  })

  it('passes validation when minor version of pr version.json is > than minor version of current version.json', async () => {
    fetch
      .mock(CURRENT_REPO_URL, { version: '1.2.9' })
      .mock(PR_REPO_URL, { version: '1.3.2' });
      core.getInput = jest.fn().mockImplementation((x) => {
        if (x === 'version-json-path') return 'version.json';
        return 'fake-token';
      });
      const result = await validation.run();
      expect(result).toBe(PASSED_VERSION_CHECK);
  })

  it('passes validation when patch version of pr version.json is > than patch version of current version.json', async () => {
    fetch
      .mock(CURRENT_REPO_URL, { version: '1.3.1' })
      .mock(PR_REPO_URL, { version: '1.3.2' });
      core.getInput = jest.fn().mockImplementation((x) => {
        if (x === 'version-json-path') return 'version.json';
        return 'fake-token';
      });
      const result = await validation.run();
      expect(result).toBe(PASSED_VERSION_CHECK);
  })

  it('fails validation when major version of pr version.json is < than major version of current version.json', async () => {
    fetch
      .mock(CURRENT_REPO_URL, { version: '1.3.1' })
      .mock(PR_REPO_URL, { version: '0.9.9' });
      core.getInput = jest.fn().mockImplementation((x) => {
        if (x === 'version-json-path') return 'version.json';
        return 'fake-token';
      });
      const result = await validation.run();
      expect(result).toBe(FAILED_VERSION_CHECK);
  })

  it('fails validation when minor version of pr version.json is < than minor version of current version.json', async () => {
    fetch
      .mock(CURRENT_REPO_URL, { version: '1.3.1' })
      .mock(PR_REPO_URL, { version: '0.1.9' });
      core.getInput = jest.fn().mockImplementation((x) => {
        if (x === 'version-json-path') return 'version.json';
        return 'fake-token';
      });
      const result = await validation.run();
      expect(result).toBe(FAILED_VERSION_CHECK);
  })

  it('fails validation when patch version of pr version.json is < than patch version of current version.json', async () => {
    fetch
      .mock(CURRENT_REPO_URL, { version: '1.3.1' })
      .mock(PR_REPO_URL, { version: '1.3.0' });
      core.getInput = jest.fn().mockImplementation((x) => {
        if (x === 'version-json-path') return 'version.json';
        return 'fake-token';
      });
      const result = await validation.run();
      expect(result).toBe(FAILED_VERSION_CHECK);
  })

  it('fails validation when `version` of pr version.json is = to `version` of current version.json', async () => {
    fetch
      .mock(CURRENT_REPO_URL, { version: '1.3.1' })
      .mock(PR_REPO_URL, { version: '1.3.1' });
      core.getInput = jest.fn().mockImplementation((x) => {
        if (x === 'version-json-path') return 'version.json';
        return 'fake-token';
      });
      const result = await validation.run();
      expect(result).toBe(FAILED_VERSION_CHECK);
  })
})