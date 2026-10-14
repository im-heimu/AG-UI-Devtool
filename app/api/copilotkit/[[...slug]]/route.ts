import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { agentHeaders, agentUrl } from "@/lib/agent-headers";

type Handler = (request: Request) => Promise<Response>;

let handler: Handler | undefined;

/**
 * Build the runtime on the first request rather than on import, so
 * `next build` works without the agent settings.
 */
function runtimeHandler(): Handler {
  handler ??= createCopilotRuntimeHandler({
    runtime: new CopilotRuntime({
      agents: {
        default: new HttpAgent({
          url: agentUrl(),
          headers: agentHeaders(),
        }),
      },
    }),
    basePath: "/api/copilotkit",
  });
  return handler;
}

function handle(request: Request): Promise<Response> {
  return runtimeHandler()(request);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
