// Where the Rindle fleet lives, resolved at RUNTIME (never baked into a build), in the same order the
// `rindle` CLI resolves a target:
//   1. env — deploys set RINDLE_DAEMON_URL / RINDLE_DAEMON_WS explicitly (docs/DEPLOY_CLOUDFLARE.md);
//      `rindle dev -- <cmd>` injects RINDLE_URL, `rindle exec` also RINDLE_DAEMON_URL / RINDLE_FLEET_WS.
//   2. the local topology — the `rindle.json` manifest `rindle up`/`dev` render at the project root, so
//      `pnpm daemon` in one terminal + `pnpm dev:web` in another finds the fleet with no wrapper.
// There is deliberately no localhost default: the CLI allocates every checkout its own port block
// (`~/.rindle/ports.json`), so any hardcoded port is wrong for every other clone and worktree.
//
// The whole local fleet sits behind ONE dev-edge ingress that serves control, reads and the live-query
// WebSocket on the SAME port — so an absent ws URL is just the http one with the scheme swapped.

interface LocalBindings {
  readHttpUrl?: string
  subscribeWsUrl?: string
  databaseToken?: string
}

/** The bindings in ./rindle.json, or {} when no local topology has been rendered (a deploy, or a fresh
 *  clone before its first `pnpm dev`). Read through `process.getBuiltinModule` so no `node:fs` import
 *  enters the workerd/client build graph; a Worker always has the env set and never gets here. */
function localBindings(): LocalBindings {
  try {
    const fs = process.getBuiltinModule('node:fs')
    const manifest = JSON.parse(fs.readFileSync('rindle.json', 'utf8')) as {
      bindings?: LocalBindings
    }
    return manifest.bindings ?? {}
  } catch {
    return {}
  }
}

/** The fleet's http ingress — the daemon control plane the API server writes/reads through. */
export function daemonUrl(): string {
  const url =
    process.env.RINDLE_DAEMON_URL ??
    process.env.RINDLE_URL ??
    localBindings().readHttpUrl
  if (!url)
    throw new Error(
      '[rindle] no fleet to connect to: run `pnpm dev` (or `pnpm daemon` first), or set RINDLE_DAEMON_URL',
    )
  return url
}

/** The server-side bearer for the ingress: the query-lease control plane AND the SQL leg mutations
 *  write through (`/v1/sql/*`). Deploys set RINDLE_DAEMON_TOKEN (a wrangler secret); `rindle dev` injects
 *  RINDLE_DATABASE_TOKEN; `pnpm daemon` + `pnpm dev:web` read it from ./rindle.json. Never sent to the
 *  browser. A managed fleet scopes it to exactly those APIs — the legacy daemon SQL endpoints
 *  (`/execute-sql-txn`, `/mutate-session/*`) answer 401 — so every write goes through the SQL leg. */
export function daemonToken(): string {
  const token =
    process.env.RINDLE_DAEMON_TOKEN ??
    process.env.RINDLE_DATABASE_TOKEN ??
    localBindings().databaseToken
  if (!token)
    throw new Error(
      '[rindle] no fleet token: run `pnpm dev` (or `pnpm daemon` first), or set RINDLE_DAEMON_TOKEN',
    )
  return token
}

/** The live-query WebSocket the BROWSER should open, or `''` when nothing is configured — the client
 *  then falls back to its own build-time override (see src/rindle/client.ts). Deliberately NOT
 *  defaulted to a localhost port: a production build with no ws env must keep deferring to the client. */
export function daemonWsUrl(): string {
  const explicit = process.env.RINDLE_DAEMON_WS ?? process.env.RINDLE_FLEET_WS
  if (explicit) return explicit
  const http = process.env.RINDLE_DAEMON_URL ?? process.env.RINDLE_URL
  if (http) return http.replace(/^http/, 'ws')
  return localBindings().subscribeWsUrl ?? ''
}
