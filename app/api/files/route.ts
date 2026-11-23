import { agentUrl } from "@/lib/agent-url";
import { forwardedHeaders } from "@/lib/runtime-headers";

// What of the agent's answer reaches the page: the file and its name.
const PASSED = ["content-type", "content-disposition"];

/**
 * A file a tool handed the user, fetched from the agent like a run:
 * at the page's agent URL, else AGENT_URL, with the headers the
 * runtime would forward. The path is the agent's own, from its root,
 * as /agents/state is; nothing on another host is fetched.
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
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const target = new URL(path, url);
  if (!path.startsWith("/") || target.origin !== new URL(url).origin) {
    return failure("Name a path on the agent, from its root.", 400);
  }
  let response: Response;
  try {
    response = await fetch(target, {
      headers: forwardedHeaders(request.headers),
      cache: "no-store",
    });
  } catch (error) {
    return failure(`The agent is unreachable: ${reason(error)}`, 502);
  }
  const headers = new Headers();
  for (const name of PASSED) {
    const value = response.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }
  return new Response(response.body, { status: response.status, headers });
}

function failure(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
