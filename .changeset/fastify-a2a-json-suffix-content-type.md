---
'@mastra/fastify': patch
---

Parse request bodies with structured `+json` suffix content types (RFC 6839), not only `application/json`.

The A2A Protocol v1.0 wire format sends requests with `Content-Type: application/a2a+json`. The Fastify server adapter only registered a content-type parser for `application/json`, so v1 requests were rejected with `Unsupported Media Type` (or reached handlers with an empty body) — surfacing as `Method not found: undefined` and breaking A2A v1 delegation over HTTP. A parser is now also registered for any `application/*+json` media type.
