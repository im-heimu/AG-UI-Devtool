"use client";

import { CopilotChat, useDefaultRenderTool } from "@copilotkit/react-core/v2";

export default function Page() {
  // Show every tool call the agent makes in the chat, with its
  // arguments, status and result.
  useDefaultRenderTool();

  return (
    <main className="chat">
      <CopilotChat />
    </main>
  );
}
