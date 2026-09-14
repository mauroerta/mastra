---
'@mastra/express': patch
---

Add `mastraJsonBodyParser()` — a JSON body parser that accepts structured `+json` suffix content types (RFC 6839), not only `application/json`.

Express does not parse request bodies unless a parser is installed, and `express.json()` recognizes only `application/json`. The A2A Protocol v1.0 wire format sends requests with `Content-Type: application/a2a+json`, so those bodies were dropped and the A2A handler saw nothing — surfacing as `Method not found: undefined` and breaking A2A v1 delegation over HTTP. Mount `mastraJsonBodyParser()` before `MastraServer` to accept `application/*+json`:

```ts
import { MastraServer, mastraJsonBodyParser } from '@mastra/express';

app.use(mastraJsonBodyParser());
await new MastraServer({ app, mastra }).init();
```
