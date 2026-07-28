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
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
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
