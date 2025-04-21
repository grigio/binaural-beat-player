/**
 * @type {import('next').NextConfig}
 */
const repoName = 'bineural-player';

const nextConfig = {
  output: 'export',
  // Set basePath and assetPrefix unconditionally for gh-pages deployment
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`, // Ensure trailing slash for assetPrefix

  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  // trailingSlash: true,
 
  // Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
  // skipTrailingSlashRedirect: true,
 
  // Optional: Change the output directory `out` -> `dist`
  // distDir: 'dist',
}
 
module.exports = nextConfig
