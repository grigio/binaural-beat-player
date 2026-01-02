/**
 * @type {import('next').NextConfig}
 */
const isProd = process.env.NODE_ENV === 'production'
const { version } = require('./package.json')

const nextConfig = {
  // Disable export for development, enable for production builds
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // Set the base path and asset prefix for GitHub Pages deployment
  basePath: isProd ? '/binaural-beat-player' : undefined,
  assetPrefix: isProd ? '/binaural-beat-player/' : undefined, // assetPrefix requires a trailing slash

  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  // trailingSlash: true,
  
  // Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
  // skipTrailingSlashRedirect: true,
  
  // Optional: Change the output directory `out` -> `dist`
  // distDir: 'dist',

  // Expose package.json version as environment variable
  env: {
    CUSTOM_VERSION: version,
  },
  
}

module.exports = nextConfig
