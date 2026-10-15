import type { AgentCapabilities } from "@ag-ui/core";
import { AgentCapabilitiesSchema } from "@ag-ui/core/schemas";
import { useEffect, useState } from "react";

/** Where the agent's declaration stands. */
export type CapabilitiesState =
  | { status: "loading" }
  | { status: "ready"; capabilities: AgentCapabilities }
  | { status: "failed"; error: string };

// Typing in the connection panel changes the headers on every key.
const SETTLE_MS = 400;

/**
 * What the agent declares it can do, asked again whenever the agent
 * URL or the headers change: CopilotKit asks only once, on connecting.
 */
export function useAgentCapabilities(
  headers: Record<string, string>,
): CapabilitiesState {
  const [state, setState] = useState<CapabilitiesState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    const timer = setTimeout(() => {
      void ask(headers, controller.signal).then((next) => {
        if (!controller.signal.aborted) {
          setState(next);
        }
      });
    }, SETTLE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [headers]);

  return state;
}

async function ask(
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<CapabilitiesState> {
  try {
    const response = await fetch("/api/capabilities", {
      headers,
      signal,
      cache: "no-store",
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      return { status: "failed", error: errorOf(body, response.status) };
    }
    const declared = AgentCapabilitiesSchema.safeParse(body);
    return declared.success
      ? { status: "ready", capabilities: declared.data }
      : { status: "failed", error: "Not AG-UI capabilities" };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function errorOf(body: unknown, status: number): string {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : `HTTP ${status}`;
}
