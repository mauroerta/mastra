---
'@mastra/client-js': minor
'@mastra/deployer': patch
'@mastra/server': patch
'@mastra/core': patch
---

Updated the client A2A resource to speak protocol v1

The client's A2A methods now send v1 message shapes and method names with an `A2A-Version: 1.0` header. Because Mastra's server negotiates both versions, existing setups keep working, and calls against a v1 server now use the v1 wire format end to end.

**Breaking (usage):** messages passed to `sendMessage`/`sendMessageStream` now use the v1 wire shape (no `kind`, `role` is `ROLE_USER`/`ROLE_AGENT`, a text part is `{ text }`), and streamed events are distinguished by their fields instead of a `kind` discriminator:

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

Agent card signature verification (`getAgentCard({ verifySignature })`) now canonicalizes cards the same way as other A2A v1 implementations, so it correctly verifies signatures produced by v1 agents.
