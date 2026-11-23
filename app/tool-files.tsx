"use client";

import type { ContentPart, Message, ToolMessage } from "@ag-ui/core";
import {
  UseAgentUpdate,
  useAgent,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";
import { useState } from "react";

/**
 * A file a tool hands the user: a document part of the tool's result,
 * fetched by URL from the agent. A path such as /agents/threads/... is
 * on the agent, as /agents/state is.
 */
type ToolFile = { name: string; url: string };

/** What CopilotKit tells a renderer of one tool call. */
type CallProps = {
  name: string;
  toolCallId: string;
  parameters: unknown;
  status: "inProgress" | "executing" | "complete";
  result: string | undefined;
};

/**
 * Show every tool call in the chat with its arguments, status and
 * result, and the files its result hands the user, to download.
 *
 * CopilotKit gives a renderer the result's text only, so the files
 * are read off the conversation's messages, where AG-UI keeps them.
 */
export function useToolCalls(headers: Record<string, string>) {
  useDefaultRenderTool(
    { render: (props) => <ToolCall {...props} headers={headers} /> },
    [headers],
  );
}

function ToolCall({
  name,
  toolCallId,
  parameters,
  status,
  result,
  headers,
}: CallProps & { headers: Record<string, string> }) {
  const { agent } = useAgent({ updates: [UseAgentUpdate.OnMessagesChanged] });
  const files = filesOf(agent.messages, toolCallId);
  return (
    <div className="tool-call">
      <details>
        <summary>
          {name} · {status === "complete" ? "done" : "running"}
        </summary>
        <pre>{JSON.stringify(parameters, null, 2)}</pre>
        {result !== undefined && <pre>{result}</pre>}
      </details>
      {files.map((file) => (
        <FileRow key={file.url} file={file} headers={headers} />
      ))}
    </div>
  );
}

function FileRow({
  file,
  headers,
}: {
  file: ToolFile;
  headers: Record<string, string>;
}) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <p className="tool-file">
      <span>{file.name}</span>
      <button
        type="button"
        onClick={() => {
          setNote("Downloading…");
          void download(file, headers).then(setNote);
        }}
      >
        Download
      </button>
      {note && <span className="hint">{note}</span>}
    </p>
  );
}

/** The files a tool call's result hands the user. */
function filesOf(messages: Message[], toolCallId: string): ToolFile[] {
  const answer = messages.find(
    (message): message is ToolMessage =>
      message.role === "tool" && message.toolCallId === toolCallId,
  );
  if (!answer || typeof answer.content === "string") {
    return [];
  }
  return answer.content.flatMap((part: ContentPart) =>
    part.type === "document" && part.source.type === "url"
      ? [
          {
            name: nameOf(part.metadata, part.source.value),
            url: part.source.value,
          },
        ]
      : [],
  );
}

function nameOf(metadata: unknown, url: string): string {
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "name" in metadata &&
    typeof metadata.name === "string"
  ) {
    return metadata.name;
  }
  return url.split("/").pop() || "file";
}

/**
 * Fetch a file through this server, with the run's headers, and save
 * it under its name. Says how it went.
 */
async function download(
  file: ToolFile,
  headers: Record<string, string>,
): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(`/api/files?path=${encodeURIComponent(file.url)}`, {
      headers,
      cache: "no-store",
    });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  if (response.status === 202) {
    return "Not ready yet: try again in a moment.";
  }
  if (!response.ok) {
    return `The agent answered ${response.status}.`;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await response.blob());
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
  return null;
}
