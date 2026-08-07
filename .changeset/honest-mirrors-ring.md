---
'@mastra/core': minor
---

Added support for A2A protocol v1 while keeping v0.3 compatible

Mastra now speaks the A2A (Agent-to-Agent) protocol v1 in addition to v0.3. The `A2AAgent` client reads a remote agent's card, picks a supported interface, and negotiates the protocol version automatically. It defaults to v1 and falls back to v0.3 for older peers. Existing v0.3 agents and clients keep working with no changes, so the runtime behavior is backward compatible.

The client's public API is unchanged:

```ts
import { A2AAgent } from '@mastra/core/a2a';

const agent = new A2AAgent({ url: 'https://remote-agent.example.com' });

// The v1/v0.3 negotiation happens under the hood
const result = await agent.generate('Summarize this document');
```

**Breaking (types only):** this upgrades the underlying `@a2a-js/sdk` dependency to v1, and `@mastra/core/a2a` re-exports the SDK's types. If you import A2A types directly, several were reshaped or removed in v1. Code that reads the old shapes needs updating.

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

Removed type exports include `MessageSendParams`, `TaskQueryParams`, `TaskIdParams`, the push-notification config param types, and `JSONRPCMessage`. Define local equivalents or read the JSON-RPC params inline.
