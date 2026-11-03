"use client";

import type { AgentCapabilities } from "@ag-ui/core";

import { readCustom } from "@/lib/custom-capabilities";
import type { CapabilitiesState } from "@/lib/use-agent-capabilities";

type Props = { state: CapabilitiesState };

/** What the agent declares it can do, from its capabilities route. */
export function CapabilitiesPanel({ state }: Props) {
  return (
    <details className="connection">
      <summary>{summary(state)}</summary>
      {state.status === "ready" && (
        <Declared capabilities={state.capabilities} />
      )}
      {state.status === "failed" && <p className="warning">{state.error}</p>}
      <p className="hint">
        GET &lt;agent URL&gt;/capabilities, asked again when the agent URL
        or headers change. Attachments offer the files declared under
        multimodal.input; an agent declaring none is offered every file.
        The custom entries read below change what runs send; the rest
        are shown as they came.
      </p>
    </details>
  );
}

function summary(state: CapabilitiesState): string {
  switch (state.status) {
    case "loading":
      return "Capabilities: asking the agent…";
    case "failed":
      return "Capabilities: not available";
    case "ready": {
      const { name, version } = state.capabilities.identity ?? {};
      const agent = [name, version].filter(Boolean).join(" ");
      return `${agent || "Agent"} · capabilities`;
    }
  }
}

function Declared({ capabilities }: { capabilities: AgentCapabilities }) {
  const { identity, custom: _custom, ...groups } = capabilities;
  const custom = readCustom(capabilities);
  const read: [string, string | undefined][] = [
    [
      "questions",
      custom.askUser &&
        `ready answers, shown when ${custom.askUser.request} is true`,
    ],
    [
      "products",
      custom.products &&
        (custom.products
          .map((product) => `${product.code} · ${product.variant}`)
          .join(", ") ||
          "none offered"),
    ],
    [
      "documents",
      custom.documents &&
        `up to ${custom.documents.maxFiles} files · ` +
          `${custom.documents.maxFileMb} MB each · ` +
          `PDF up to ${custom.documents.maxPdfPages} pages`,
    ],
    ["languages", custom.languages?.join(", ")],
  ];
  return (
    <>
      {identity?.description && (
        <p className="hint">{identity.description}</p>
      )}
      <dl className="capabilities">
        {Object.entries(groups).map(([group, declared]) => (
          <Row key={group} name={group} value={describe(declared)} />
        ))}
        {read.map(
          ([name, value]) =>
            value !== undefined && <Row key={name} name={name} value={value} />,
        )}
      </dl>
      {Object.keys(custom.other).length > 0 && (
        <>
          <span className="label">custom</span>
          <pre className="custom">{JSON.stringify(custom.other, null, 2)}</pre>
        </>
      )}
    </>
  );
}

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div>
      <dt>{name}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Read a declared group as one line: "streaming yes · websocket no". */
function describe(declared: unknown): string {
  if (typeof declared === "boolean") {
    return declared ? "yes" : "no";
  }
  if (Array.isArray(declared)) {
    return declared.map(describe).join(", ");
  }
  if (typeof declared === "object" && declared !== null) {
    return Object.entries(declared)
      .map(([name, value]) =>
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? `${name} (${describe(value)})`
          : `${name} ${describe(value)}`,
      )
      .join(" · ");
  }
  return String(declared);
}
