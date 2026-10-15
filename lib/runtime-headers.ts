/**
 * Header the page sends the agent URL in. CopilotKit forwards only
 * Authorization and X-* headers, so it never reaches the agent.
 */
export const AGENT_URL_HEADER = "Devtool-Agent-Url";

/**
 * Whether the runtime passes a header on to the agent. CopilotKit
 * forwards Authorization and X-* headers, minus proxy headers such as
 * X-Request-ID and X-Forwarded-*.
 */
export function isForwarded(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return lower === "authorization" || lower.startsWith("x-");
}

/**
 * The headers of a page request to pass on to the agent, as the
 * runtime does for a run. X-Forwarded-* describe the hop from the
 * browser to this server, not to the agent.
 */
export function forwardedHeaders(headers: Headers): Record<string, string> {
  const forwarded: Record<string, string> = {};
  headers.forEach((value, name) => {
    if (isForwarded(name) && !name.startsWith("x-forwarded-")) {
      forwarded[name] = value;
    }
  });
  return forwarded;
}
