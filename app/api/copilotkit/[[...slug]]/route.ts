import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { agentUrl } from "@/lib/agent-url";

/**
 * One agent, created per request for the URL the page sends, else
 * AGENT_URL. The runtime forwards the page's Authorization and X-*
 * headers to it.
 */
const handler = createCopilotRuntimeHandler({
  runtime: new CopilotRuntime({
    agents: ({ request }) => ({
      // Discovery only lists the agent, so it needs no URL.
      default: new HttpAgent({ url: agentUrl(request) ?? "" }),
    }),
  }),
  basePath: "/api/copilotkit",
});

async function handle(request: Request): Promise<Response> {
  if (request.method !== "GET" && agentUrl(request) === undefined) {
    return Response.json(
      {
        error:
          "Set an http(s) agent URL in the page, or AGENT_URL on the " +
          "devtool server.",
      },
      { status: 400 },
    );
  }
  return handler(request);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
