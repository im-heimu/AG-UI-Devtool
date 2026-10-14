import { AGENT_URL_HEADER } from "./runtime-headers";

/**
 * The agent's AG-UI endpoint for a request: the URL set in the page,
 * else AGENT_URL. Undefined when neither is set or it is not http(s).
 */
export function agentUrl(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const value = request.headers.get(AGENT_URL_HEADER) || env.AGENT_URL;
  if (!value || !URL.canParse(value)) {
    return undefined;
  }
  const { protocol } = new URL(value);
  return protocol === "http:" || protocol === "https:" ? value : undefined;
}
