import { useEffect, useMemo, useState } from "react";

import { AGENT_URL_HEADER } from "./runtime-headers";

/** One editable header; `id` keeps React keys stable while typing. */
export type HeaderRow = { id: string; name: string; value: string };

const STORAGE_KEY = "ag-ui-devtool:connection";

/** A new, empty row. */
export function emptyRow(): HeaderRow {
  return { id: crypto.randomUUID(), name: "", value: "" };
}

/**
 * The agent URL and header rows of this tab, and the headers the page
 * sends to the runtime with every request.
 *
 * They live in sessionStorage: a reload keeps them, closing the tab
 * forgets them, so tokens do not linger on disk.
 */
export function useConnection() {
  const [agentUrl, setAgentUrl] = useState("");
  const [rows, setRows] = useState<HeaderRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Storage exists only in the browser, after the first render.
  useEffect(() => {
    const stored = load();
    setAgentUrl(stored.agentUrl);
    setRows(stored.rows);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      save(agentUrl, rows);
    }
  }, [agentUrl, rows, loaded]);

  const headers = useMemo(
    () => runtimeHeaders(agentUrl, rows),
    [agentUrl, rows],
  );
  return { agentUrl, setAgentUrl, rows, setRows, headers };
}

/** Named rows, the last one winning on repeats, plus the agent URL. */
function runtimeHeaders(
  agentUrl: string,
  rows: readonly HeaderRow[],
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const row of rows) {
    const name = row.name.trim();
    if (name) {
      headers[name] = row.value;
    }
  }
  if (agentUrl.trim()) {
    headers[AGENT_URL_HEADER] = agentUrl.trim();
  }
  return headers;
}

function load(): { agentUrl: string; rows: HeaderRow[] } {
  const empty = { agentUrl: "", rows: [] };
  let stored: unknown;
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return empty;
  }
  if (typeof stored !== "object" || stored === null) {
    return empty;
  }
  const agentUrl =
    "agentUrl" in stored && typeof stored.agentUrl === "string"
      ? stored.agentUrl
      : "";
  const headers =
    "headers" in stored && Array.isArray(stored.headers)
      ? stored.headers
      : [];
  const rows: HeaderRow[] = [];
  for (const item of headers) {
    if (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "value" in item &&
      typeof item.name === "string" &&
      typeof item.value === "string"
    ) {
      rows.push({ ...emptyRow(), name: item.name, value: item.value });
    }
  }
  return { agentUrl, rows };
}

function save(agentUrl: string, rows: readonly HeaderRow[]): void {
  const headers = rows.map(({ name, value }) => ({ name, value }));
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ agentUrl, headers }));
  } catch {
    // Storage is blocked: the settings still work for this page view.
  }
}
