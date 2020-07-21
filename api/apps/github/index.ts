import { AppSpec } from '../../app-base/App'
import { ok } from '../../app-base/request'

function getHeaders(apiToken, post = false) {
  return {
    Authorization: `token ${apiToken}`,
    ...(post ? { 'Content-Type': 'application/json' } : {}),
  }
}

function auth({ env, params: { apiToken } }) {
  env.GITHUB_TOKEN = apiToken
  return 'API key saved to session.'
}

function authClear({ env }) {
  delete env.GITHUB_TOKEN
  return 'API key cleared.'
}

function issueApiUrl({ owner, repo, number }: any) {
  return `https://api.github.com/repos/${owner}/${repo}/issues/${number}`
}

async function close({ env: { GITHUB_TOKEN: apiToken }, params, request }) {
  const response = await request({
    url: issueApiUrl(params),
    method: 'PATCH',
    headers: getHeaders(apiToken, true),
    body: JSON.stringify({ state: 'closed' }),
  })
  if (ok(response)) {
    return { type: 'text', text: `Issue closed` }
  } else {
    return { type: 'text', text: `Error closing issue` }
  }
}

async function comment({
  env: { GITHUB_TOKEN: apiToken },
  params: { comment, ...params },
  request,
}) {
  const response = await request({
    url: `${issueApiUrl(params)}/comments`,
    method: 'POST',
    headers: getHeaders(apiToken, true),
    body: JSON.stringify({ body: comment }),
  })
  if (ok(response)) {
    return { type: 'text', text: 'Comment added.' }
  } else {
    return { type: 'text', text: 'Error adding comment.' }
  }
}

async function run({ action, env, params, request }) {
  if (action === 'auth') {
    return auth({ env, params })
  } else if (action === 'auth/clear') {
    return authClear({ env })
  } else {
    if (env.GITHUB_TOKEN) {
      if (action === 'close') {
        return await close({ env, params, request })
      } else if (action === 'comment') {
        return await comment({ env, params, request })
      }
    } else {
      return {
        type: 'error',
        text: 'A GitHub personal access token is required.',
      }
    }
  }
}

export default async function app(): Promise<AppSpec> {
  return {
    name: 'GitHub',
    description: 'Collaborate on GitHub',
    environmentVariables: {
      GITHUB_TOKEN: {
        doc: `
          A GitHub personal access token, from the
          [GitHub Developer Settings](https://github.com/settings/tokens)'
        `,
      },
    },
    resourceTypes: {
      auth: {
        routes: [
          {
            host: 'github.com',
            path: '/:any*',
          },
          { path: '/github' },
        ],
        actions: {
          auth: { params: ['apiToken'] },
          clearAuth: {
            params: [],
          },
        },
      },
      issues: {
        routes: [
          {
            host: 'github.com',
            path: '/:owner/:repo/issues/:number',
          },
          { path: '/github/:issues/:owner/:repo/:number' },
        ],
        actions: {
          comment: {
            params: ['comment'],
          },
          close: {
            params: [],
          },
        },
      },
    },
    run,
  }
}