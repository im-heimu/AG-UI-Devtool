import type { AgentCapabilities } from "@ag-ui/core";

import type { Documents } from "@/lib/custom-capabilities";

/**
 * Where an agent served at `agentUrl` declares what it can do: the
 * `capabilities` route next to its AG-UI endpoint, as ag_ui_adk serves
 * it (`/chat` declares at `/chat/capabilities`).
 */
export function capabilitiesUrl(agentUrl: string): string {
  const url = new URL(agentUrl);
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/capabilities`;
  return url.toString();
}

/** Which files the chat offers to attach, and how large. */
export type AttachmentPolicy = {
  enabled: boolean;
  accept?: string;
  maxSize?: number;
};

const MB = 1024 * 1024;

const MODALITIES = [
  ["image", "image/*"],
  ["audio", "audio/*"],
  ["video", "video/*"],
  ["pdf", "application/pdf"],
] as const;

/**
 * Offer the files the agent declares it reads, no larger than it
 * reads them. An agent that declares no input at all is not known to
 * refuse any (AG-UI: undeclared means unknown), so every file is
 * offered.
 */
export function attachmentPolicy(
  capabilities: AgentCapabilities | undefined,
  documents?: Documents,
): AttachmentPolicy {
  const size = documents ? { maxSize: documents.maxFileMb * MB } : {};
  const input = capabilities?.multimodal?.input;
  if (input === undefined || input.file) {
    return { enabled: true, ...size };
  }
  const accepted = MODALITIES.filter(([kind]) => input[kind]).map(
    ([, type]) => type,
  );
  return accepted.length > 0
    ? { enabled: true, accept: accepted.join(","), ...size }
    : { enabled: false };
}
