/**
 * Next.js is configured as a fully static export so the site can be served from
 * GitHub Pages, which has no server runtime. `output: 'export'` makes
 * `next build` emit a static `out/` directory instead of a server bundle.
 *
 * GitHub Pages serves a project site under `https://<user>.github.io/ircc-stats/`,
 * so every asset and route must be prefixed with that subpath. We drive the
 * prefix from an env var so local `next dev` (empty prefix) and the deployed
 * site (`/ircc-stats`) both work without code changes.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// Pin the Turbopack workspace root explicitly. Left to infer, Turbopack walks up
// looking for lockfiles; when this project is checked out as a git worktree
// (its own lockfile, but no node_modules) nested inside the main repo, inference
// climbs past the repo, mis-scopes compilation, and logs the "inferred your
// workspace root" warning.
//
// The root must be the directory that actually holds node_modules — the main
// repo, since a worktree resolves `next` from the parent checkout. Walk up from
// the config's own directory to the nearest ancestor with a node_modules dir;
// in the main checkout that is the repo root itself. (This scopes Turbopack; it
// does not stop Watchpack's own parent-chain walk from touching an unreadable
// $HOME under a restricted sandbox user — that EACCES noise is environmental.)
const configDir = dirname(fileURLToPath(import.meta.url));
function findWorkspaceRoot(start) {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, 'node_modules'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start; // hit the filesystem root; fall back
    dir = parent;
  }
}
const projectRoot = findWorkspaceRoot(configDir);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  turbopack: { root: projectRoot },
  // GitHub Pages serves `/foo/` as `/foo/index.html`; trailing slashes keep
  // deep links working when there is no server to rewrite them.
  trailingSlash: true,
  images: {
    // The Next.js image optimizer needs a server, which Pages does not provide.
    unoptimized: true,
  },
  // Hosts allowed to load dev-only resources (HMR, fonts) when reaching the dev
  // server from another device on the LAN. Dev-only; ignored by the static export.
  allowedDevOrigins: ['192.168.86.22'],
};

export default nextConfig;
