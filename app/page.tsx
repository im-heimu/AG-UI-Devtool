import { Devtool } from "./devtool";

// Read AGENT_URL on each request, not once at build time.
export const dynamic = "force-dynamic";

export default function Page() {
  return <Devtool defaultAgentUrl={process.env.AGENT_URL} />;
}
