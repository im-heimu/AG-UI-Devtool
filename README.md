# ag-ui-devtool

A local chat for any [AG-UI](https://docs.ag-ui.com) agent, built on
[CopilotKit](https://docs.copilotkit.ai). It shows:

- the answer as a frontend shows it, including the streaming;
- every tool call, with its arguments, status and result;
- the CopilotKit Inspector (button in the top right corner):
  - **AG-UI Events**: every raw event of a run (`RUN_STARTED`,
    `TEXT_MESSAGE_*`, `TOOL_CALL_*`, `STATE_SNAPSHOT`, `RUN_ERROR`…);
  - **Agent**: the agent's state and messages.

```
browser :3000 -> Next.js page + Inspector
                 /api/copilotkit (CopilotRuntime)
                   -> HttpAgent -> AGENT_URL + headers from .env
```

The runtime calls the agent from the server, so the agent needs no
CORS setup. This is a development tool: it sends whatever identity
headers `.env` holds. Never expose it beyond localhost.

## Run

```sh
cp .env.example .env    # then set AGENT_URL and the headers
```

With Node.js 24:

```sh
npm ci
npm run dev             # http://localhost:3000
```

Or with Docker:

```sh
docker compose up --build --watch
```

## Settings

| Variable | Purpose |
| --- | --- |
| `AGENT_URL` | AG-UI endpoint, e.g. `http://localhost:8000/chat` |
| `AGENT_HEADERS` | JSON object of headers sent with every run |
| `AGENT_TOKEN` | Bearer token, sent as `Authorization` |
| `DOCKER_AGENT_URL` | Docker only, defaults to `http://host.docker.internal:8000/chat` |

For example, a local gan with `AUTH__TRUST_IDENTITY_HEADERS=true`
identifies the user by a header:

```sh
AGENT_HEADERS='{"X-CURRENT-USER-ID": "11111111-1111-4111-8111-111111111111"}'
```

A gan that verifies tokens needs `AGENT_TOKEN` instead.

## Notes

- CopilotKit cloud features (Intelligence, Threads, Learning) stay
  off: they need a CopilotKit account and send data to their cloud.
- `.env.example` turns off Next.js and CopilotKit usage telemetry.
- `npm run typecheck` checks types; `npm run build` checks the build.
