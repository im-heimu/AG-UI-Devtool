# ag-ui-devtool

A local chat for any [AG-UI](https://docs.ag-ui.com) agent, built on
[CopilotKit](https://docs.copilotkit.ai). It shows:

- the agent URL and request headers, editable in the page;
- what the agent declares it can do, from its AG-UI capabilities;
- the answer as a frontend shows it, including the streaming;
- file attachments (the + button, drag and drop or paste), sent to the
  agent inline as base64 image, audio, video or document parts of the
  user message, up to 20 MB each, of the kinds the agent declares it
  reads;
- every tool call, with its arguments, status and result;
- the CopilotKit Inspector (button in the top right corner):
  - **AG-UI Events**: every raw event of a run (`RUN_STARTED`,
    `TEXT_MESSAGE_*`, `TOOL_CALL_*`, `STATE_SNAPSHOT`, `RUN_ERROR`…);
  - **Agent**: the agent's state and messages.

```
browser :3000 -> page: connection and capabilities panels + chat + Inspector
                 /api/copilotkit (CopilotRuntime)
                   -> HttpAgent -> agent URL + headers from the page
                 /api/capabilities
                   -> GET <agent URL>/capabilities + the same headers
```

The runtime calls the agent from the server, so the agent needs no
CORS setup. The server calls whatever URL the page gives it and
passes on whatever identity headers the page holds, so it listens on
127.0.0.1 only. Never expose it beyond localhost.

## Run

With Node.js 24:

```sh
npm ci
npm run dev             # http://localhost:3000
```

Or with Docker:

```sh
docker compose up --build --watch
```

Optionally copy `.env.example` to `.env` to set the default agent URL
and turn off usage telemetry.

## Connection

The panel above the chat sets where runs go and what they carry. Both
apply from the next run, so the agent, user or token can change
mid-conversation.

- **Agent URL**: the AG-UI endpoint, e.g. `http://localhost:8000/chat`.
  Empty means `AGENT_URL` of the devtool server. In Docker the server
  runs in a container: reach an agent on the host through
  `host.docker.internal`, not `localhost`.
- **Headers**: the CopilotKit runtime forwards only `Authorization`
  and `X-*` headers, and drops proxy ones such as `X-Request-ID` and
  `X-Forwarded-*`. The panel flags names it will not forward.
  `Authorization` values are masked.

Both are kept in sessionStorage: a reload keeps them, closing the tab
forgets them.

For example, a local gan with `AUTH__TRUST_IDENTITY_HEADERS=true`
identifies the user by `X-CURRENT-USER-ID: <uuid>`. A gan that
verifies tokens needs `Authorization: Bearer <token>` instead.

## Capabilities

The panel below the connection shows what the agent declares it can
do: its name, version and description, transport, tools, state,
reasoning, multimodal input and output, limits, and any custom
entries. The devtool server reads them from `<agent URL>/capabilities`
(e.g. `http://localhost:8000/chat/capabilities`, where ag_ui_adk
serves them) with the same headers as a run, and asks again whenever
the agent URL or headers change.

Attachments follow `multimodal.input`: an agent declaring images only
gets an image picker, one declaring no input gets none. An agent that
declares no capabilities, or cannot be asked, is offered every file.

## Settings

| Variable | Purpose |
| --- | --- |
| `AGENT_URL` | Default agent URL, used when the page leaves it empty |
| `DOCKER_AGENT_URL` | Docker only, defaults to `http://host.docker.internal:8000/chat` |

## Notes

- CopilotKit cloud features (Intelligence, Threads, Learning) stay
  off: they need a CopilotKit account and send data to their cloud.
- `.env.example` turns off Next.js and CopilotKit usage telemetry.
- `npm run typecheck` checks types; `npm run build` checks the build.
