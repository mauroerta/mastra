---
'@mastra/core': minor
'@mastra/server': minor
'@mastra/client-js': minor
'@mastra/deployer': patch
---

Added support for the A2A (Agent-to-Agent) protocol v1, while staying backward compatible with v0.3

Mastra now speaks A2A v1 in both directions. The version is negotiated automatically through the `A2A-Version` header, so existing v0.3 agents and clients keep working with no changes.

**Server**

A2A endpoints accept both v1 and v0.3 requests. The server reads the `A2A-Version` header (defaulting to v1), accepts both v1 PascalCase method names (`SendMessage`, `GetTask`, …) and v0.3 slash-names (`message/send`, `tasks/get`, …), and serves a v1 agent card that is translated down to the v0.3 shape for older clients. A new v1-only `ListTasks` method returns an agent's tasks with pagination. The same `/a2a/:agentId` endpoint and `/.well-known/:agentId/agent-card.json` path are used.

**Client (`A2AAgent`)**

`A2AAgent` reads a remote agent's card, selects a supported interface, and negotiates the protocol version. Its public API is unchanged:

```ts
import { A2AAgent } from '@mastra/core/a2a';

const agent = new A2AAgent({ url: 'https://remote-agent.example.com' });

// v1/v0.3 negotiation happens under the hood
const result = await agent.generate('Summarize this document');
```

**JavaScript client (`MastraClient.getA2A()`)**

Messages now use the v1 wire shape (no `kind`, `role` is `ROLE_USER`/`ROLE_AGENT`, a text part is `{ text }`), and streamed events are distinguished by their fields:

```ts
// Before (v0.3)
const stream = a2a.sendMessageStream({
  message: {
    kind: 'message',
    role: 'user',
    messageId: crypto.randomUUID(),
    parts: [{ kind: 'text', text: 'Hello' }],
  },
});
for await (const event of stream) {
  if (event.kind === 'artifact-update') console.log(event.artifact.parts);
}

// After (v1)
const stream = a2a.sendMessageStream({
  message: {
    role: 'ROLE_USER',
    messageId: crypto.randomUUID(),
    parts: [{ text: 'Hello' }],
  },
});
for await (const event of stream) {
  if ('artifact' in event) console.log(event.artifact.parts);
}
```

**Breaking (types only)**

This upgrades the underlying `@a2a-js/sdk` dependency to v1, and `@mastra/core/a2a` re-exports the SDK's types. Runtime behavior is backward compatible, but if you import A2A types directly, several were reshaped or removed in v1.

Agent card:

```ts
// Before (v0.3)
card.url;
card.supportsAuthenticatedExtendedCard;

// After (v1)
card.supportedInterfaces[0].url;
card.capabilities?.extendedAgentCard;
```

Messages, parts, and task state no longer use the `kind` discriminator, and state/role are now v1 string values:

```ts
// Before (v0.3)
message.parts.filter(p => p.kind === 'text').map(p => p.text);
task.status.state === 'completed';

// After (v1)
message.parts.filter(p => 'text' in p).map(p => p.text);
task.status.state === 'TASK_STATE_COMPLETED';
```

Removed type exports include `MessageSendParams`, `TaskQueryParams`, `TaskIdParams`, the push-notification config param types, and `JSONRPCMessage`.

**Additional fixes**

- Signed agent cards now canonicalize the same way as other A2A v1 implementations (via the SDK's `canonicalizeAgentCard`), and the signature's protected header includes `typ` by default. Previously the canonicalization diverged, so cards Mastra signed would fail verification against A2A v1 peers, and the client verifier would reject valid v1 signatures.
- Inbound `data` message parts now return a content-type error instead of a generic internal error.
- Removed a dead, unreferenced legacy A2A request handler from `@mastra/deployer`.
