import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep `next dev` from writing AGENTS.md when an AI agent runs it.
  agentRules: false,
};

export default nextConfig;
