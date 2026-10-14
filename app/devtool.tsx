"use client";

import {
  CopilotChat,
  CopilotKitProvider,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";

import { useConnection } from "@/lib/connection";

import { ConnectionPanel } from "./connection-panel";

type Props = { defaultAgentUrl: string | undefined };

export function Devtool({ defaultAgentUrl }: Props) {
  const { agentUrl, setAgentUrl, rows, setRows, headers } = useConnection();

  // Every request to the runtime carries the agent URL and headers;
  // the Inspector is on in dev builds.
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" headers={headers}>
      <main className="layout">
        <ConnectionPanel
          defaultAgentUrl={defaultAgentUrl}
          agentUrl={agentUrl}
          onAgentUrlChange={setAgentUrl}
          rows={rows}
          onRowsChange={setRows}
        />
        <Chat />
      </main>
    </CopilotKitProvider>
  );
}

function Chat() {
  // Show every tool call the agent makes in the chat, with its
  // arguments, status and result.
  useDefaultRenderTool();

  return (
    <div className="chat">
      <CopilotChat />
    </div>
  );
}
