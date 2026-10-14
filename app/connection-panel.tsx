"use client";

import { emptyRow, type HeaderRow } from "@/lib/connection";
import { isForwarded } from "@/lib/runtime-headers";

type Props = {
  defaultAgentUrl: string | undefined;
  agentUrl: string;
  onAgentUrlChange: (agentUrl: string) => void;
  rows: readonly HeaderRow[];
  onRowsChange: (rows: HeaderRow[]) => void;
};

/** Edit where runs go and the headers sent with them. */
export function ConnectionPanel({
  defaultAgentUrl,
  agentUrl,
  onAgentUrlChange,
  rows,
  onRowsChange,
}: Props) {
  const update = (id: string, patch: Partial<HeaderRow>) => {
    onRowsChange(
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };
  const remove = (id: string) => {
    onRowsChange(rows.filter((row) => row.id !== id));
  };
  const target = agentUrl.trim() || defaultAgentUrl || "not set";
  const named = rows.filter((row) => row.name.trim()).length;

  return (
    <details className="connection" open>
      <summary>
        {target} · {named} {named === 1 ? "header" : "headers"}
      </summary>

      <label className="field">
        <span>Agent URL</span>
        <input
          type="url"
          placeholder={defaultAgentUrl ?? "http://localhost:8000/chat"}
          value={agentUrl}
          onChange={(event) => onAgentUrlChange(event.target.value)}
        />
      </label>
      <p className="hint">
        AG-UI endpoint, called by the devtool server. Empty: AGENT_URL
        of the server ({defaultAgentUrl ?? "not set"}).
      </p>

      <span className="label">Headers</span>
      {rows.map((row) => (
        <div className="header-row" key={row.id}>
          <input
            aria-label="Header name"
            placeholder="X-CURRENT-USER-ID"
            value={row.name}
            onChange={(event) => update(row.id, { name: event.target.value })}
          />
          <input
            aria-label="Header value"
            placeholder="value"
            type={isSecret(row.name) ? "password" : "text"}
            value={row.value}
            onChange={(event) =>
              update(row.id, { value: event.target.value })
            }
          />
          <button
            type="button"
            aria-label={`Remove ${row.name || "header"}`}
            onClick={() => remove(row.id)}
          >
            ×
          </button>
          {row.name.trim() && !isForwarded(row.name) && (
            <p className="warning">
              Not forwarded: the runtime passes on only Authorization and
              X-* headers.
            </p>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onRowsChange([...rows, emptyRow()])}
      >
        + Add header
      </button>
      <p className="hint">
        Both apply from the next run. CopilotKit forwards Authorization
        and X-* headers to the agent, except proxy ones such as
        X-Request-ID. Kept in this tab only.
      </p>
    </details>
  );
}

function isSecret(name: string): boolean {
  return name.trim().toLowerCase() === "authorization";
}
