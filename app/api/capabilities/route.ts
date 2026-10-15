import { AgentCapabilitiesSchema } from "@ag-ui/core/schemas";

import { agentUrl } from "@/lib/agent-url";
import { capabilitiesUrl } from "@/lib/capabilities";
import { forwardedHeaders } from "@/lib/runtime-headers";

/**
 * What the agent declares it can do. Asked from this server like a
 * run: at the page's agent URL, else AGENT_URL, with the headers the
 * runtime would forward.
 */
export async function GET(request: Request): Promise<Response> {
  const url = agentUrl(request);
  if (url === undefined) {
    return failure(
      "Set an http(s) agent URL in the page, or AGENT_URL on the " +
        "devtool server.",
      400,
    );
  }
  let response: Response;
  try {
    response = await fetch(capabilitiesUrl(url), {
      headers: forwardedHeaders(request.headers),
      cache: "no-store",
    });
  } catch (error) {
    return failure(`The agent is unreachable: ${reason(error)}`, 502);
  }
  if (!response.ok) {
    return failure(
      `The agent answered ${response.status} at ${capabilitiesUrl(url)}`,
      502,
    );
  }
  const declared = AgentCapabilitiesSchema.safeParse(
    await response.json().catch(() => undefined),
  );
  if (!declared.success) {
    return failure("The agent's answer is not AG-UI capabilities", 502);
  }
  return Response.json(declared.data);
}

function failure(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
