import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep `next dev` from writing AGENTS.md when an AI agent runs it.
  agentRules: false,
  // The server listens on 127.0.0.1; without this, a page opened there
  // loses hot reload, as only localhost may load dev resources.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
