/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Several agents build this project at once; NEXT_DIST_DIR lets each use its own
  // output directory so one build cannot tear down another's .next mid-run.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

module.exports = nextConfig
