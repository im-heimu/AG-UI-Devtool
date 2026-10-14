/**
 * Headers the runtime sends to the agent with every run.
 *
 * AGENT_HEADERS is a JSON object of header names to values, for
 * example the identity headers a local agent trusts. AGENT_TOKEN adds
 * a bearer token, for agents that verify one.
 */
export function agentHeaders(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const headers = env.AGENT_HEADERS ? parseHeaders(env.AGENT_HEADERS) : {};
  if (env.AGENT_TOKEN) {
    headers.Authorization = `Bearer ${env.AGENT_TOKEN}`;
  }
  return headers;
}

/** The agent's AG-UI endpoint, required to start a run. */
export function agentUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (!env.AGENT_URL) {
    throw new Error("Set AGENT_URL to the agent's AG-UI endpoint.");
  }
  return env.AGENT_URL;
}

function parseHeaders(json: string): Record<string, string> {
  const invalid = new Error(
    'AGENT_HEADERS must be a JSON object of strings, e.g. {"X-Name": "v"}.',
  );
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new Error(invalid.message, { cause: error });
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalid;
  }
  const headers: Record<string, string> = {};
  for (const [name, header] of Object.entries(value)) {
    if (typeof header !== "string") {
      throw invalid;
    }
    headers[name] = header;
  }
  return headers;
}
