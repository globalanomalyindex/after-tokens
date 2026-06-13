import type { NextConfig } from "next";

// The same app ships to two hosts. Vercel serves it at the domain root, so the
// default config stays empty and that build is untouched. GitHub Pages serves a
// project site from a subpath (/after-tokens), so only the Pages build, which
// sets GITHUB_PAGES=true in the deploy workflow, switches on static export and
// the base path.
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGithubPages
  ? {
      output: "export",
      basePath: "/after-tokens",
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
