"use client";

import { useState } from "react";

import {
  CopilotChat,
  CopilotKitProvider,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";

import { type AttachmentPolicy, attachmentPolicy } from "@/lib/capabilities";
import { useConnection } from "@/lib/connection";
import { useAgentCapabilities } from "@/lib/use-agent-capabilities";

import { useAskUser } from "./ask-user";
import { CapabilitiesPanel } from "./capabilities-panel";
import { ConnectionPanel } from "./connection-panel";

type Props = { defaultAgentUrl: string | undefined };

// Sent with every run as forwardedProps: the page shows the questions
// the agent asks (see ask-user.tsx). An agent without them ignores it.
const PROPERTIES = { askUser: true };

export function Devtool({ defaultAgentUrl }: Props) {
  const { agentUrl, setAgentUrl, rows, setRows, headers } = useConnection();
  const capabilities = useAgentCapabilities(headers);

  // Every request to the runtime carries the agent URL and headers;
  // the Inspector is on in dev builds.
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      headers={headers}
      properties={PROPERTIES}
    >
      <main className="layout">
        <ConnectionPanel
          defaultAgentUrl={defaultAgentUrl}
          agentUrl={agentUrl}
          onAgentUrlChange={setAgentUrl}
          rows={rows}
          onRowsChange={setRows}
        />
        <CapabilitiesPanel state={capabilities} />
        <Chat
          attachments={attachmentPolicy(
            capabilities.status === "ready"
              ? capabilities.capabilities
              : undefined,
          )}
        />
      </main>
    </CopilotKitProvider>
  );
}

function Chat({ attachments }: { attachments: AttachmentPolicy }) {
  // Show every tool call the agent makes in the chat, with its
  // arguments, status and result.
  useDefaultRenderTool();
  // Questions the agent asks: answered here, the run waits for them.
  useAskUser();
  // CopilotKit drops a rejected file silently; say why instead.
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <>
      {uploadError && (
        <p className="upload-error" role="alert">
          {uploadError}
          <button type="button" onClick={() => setUploadError(null)}>
            Dismiss
          </button>
        </p>
      )}
      <div className="chat">
        {/* Files go to the agent inline, as base64 data parts of the
            user message, limited to what the agent declares it reads. */}
        <CopilotChat
          attachments={{
            ...attachments,
            onUploadFailed: (error) =>
              setUploadError(`${error.file.name}: ${error.message}`),
          }}
        />
      </div>
    </>
  );
}
