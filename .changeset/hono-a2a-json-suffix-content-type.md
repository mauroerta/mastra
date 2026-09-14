---
'@mastra/hono': patch
---

Parse request bodies with structured `+json` suffix content types (RFC 6839), not only `application/json`.

The A2A Protocol v1.0 wire format sends requests with `Content-Type: application/a2a+json`. The Hono server adapter's body parser only recognized `application/json`, so v1 requests reached handlers with an empty body — surfacing as `Method not found: undefined` and breaking A2A v1 delegation over HTTP. The parser now also accepts any `+json` media type.
