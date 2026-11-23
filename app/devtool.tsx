"use client";

import { useMemo, useState } from "react";

import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";

import { type AttachmentPolicy, attachmentPolicy } from "@/lib/capabilities";
import { useConnection } from "@/lib/connection";
import {
  choiceKey,
  offeredChoice,
  type Product,
  productChoices,
  readCustom,
} from "@/lib/custom-capabilities";
import { useAgentCapabilities } from "@/lib/use-agent-capabilities";

import { useAskUser } from "./ask-user";
import { CapabilitiesPanel } from "./capabilities-panel";
import { ConnectionPanel } from "./connection-panel";
import { useToolCalls } from "./tool-files";

type Props = { defaultAgentUrl: string | undefined };

export function Devtool({ defaultAgentUrl }: Props) {
  const { agentUrl, setAgentUrl, rows, setRows, headers } = useConnection();
  const capabilities = useAgentCapabilities(headers);
  const declared =
    capabilities.status === "ready" ? capabilities.capabilities : undefined;
  const custom = useMemo(() => readCustom(declared), [declared]);
  // The product picked; kept only while the agent offers it to the
  // user the headers name.
  const [picked, setPicked] = useState<string | null>(null);
  const product = useMemo(
    () => offeredChoice(picked, custom.products),
    [picked, custom.products],
  );

  // Sent with every run as forwardedProps: questions are shown if the
  // agent asks them (see ask-user.tsx), and the product picked is the
  // one the agent keeps to.
  const properties = useMemo(
    () => ({
      ...(custom.askUser ? { askUser: true } : {}),
      ...(product ? { product } : {}),
    }),
    [custom.askUser, product],
  );

  // Every request to the runtime carries the agent URL and headers;
  // the Inspector is on in dev builds.
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      headers={headers}
      properties={properties}
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
        {custom.products && custom.products.length > 0 && (
          <ProductPicker
            products={custom.products}
            picked={product ? choiceKey(product) : null}
            onPick={setPicked}
          />
        )}
        <Chat
          attachments={attachmentPolicy(declared, custom.documents)}
          headers={headers}
        />
      </main>
    </CopilotKitProvider>
  );
}

type PickerProps = {
  products: Product[];
  picked: string | null;
  onPick: (picked: string | null) => void;
};

/** Pick the product runs keep to, from those the agent offers. */
function ProductPicker({ products, picked, onPick }: PickerProps) {
  return (
    <label className="connection product">
      <span>Product</span>
      <select
        value={picked ?? ""}
        onChange={(event) => onPick(event.target.value || null)}
      >
        <option value="">All products</option>
        {productChoices(products).map((choice) => (
          <option key={choiceKey(choice)} value={choiceKey(choice)}>
            {choice.variant
              ? `${choice.code} · ${choice.variant}`
              : `${choice.code}, every variant`}
          </option>
        ))}
      </select>
    </label>
  );
}

type ChatProps = {
  attachments: AttachmentPolicy;
  // Sent with a file's download, as with every run.
  headers: Record<string, string>;
};

function Chat({ attachments, headers }: ChatProps) {
  // Show every tool call the agent makes in the chat, with its
  // arguments, status and result, and the files it hands the user.
  useToolCalls(headers);
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
