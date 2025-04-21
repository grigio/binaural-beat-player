/**
 * @type {import('next').NextConfig}
 */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  output: 'export',
  // Set the base path and asset prefix for GitHub Pages deployment
  basePath: isProd ? '/bineural-player' : undefined,
  assetPrefix: isProd ? '/bineural-player/' : undefined, // assetPrefix requires a trailing slash

  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  // trailingSlash: true,
 
  // Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
  // skipTrailingSlashRedirect: true,
 
  // Optional: Change the output directory `out` -> `dist`
  // distDir: 'dist',
}

module.exports = nextConfig
