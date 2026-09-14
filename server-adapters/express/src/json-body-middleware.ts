import express from 'express';
import type { RequestHandler } from 'express';

/**
 * Options for {@link mastraJsonBodyParser}.
 */
export interface MastraJsonBodyParserOptions {
  /**
   * Maximum request body size, forwarded to `express.json({ limit })`.
   * Accepts anything `express.json` accepts (bytes number or a string like `'4mb'`).
   */
  limit?: number | string;
}

/**
 * A drop-in JSON body parser for Mastra's Express adapter.
 *
 * Express does not parse request bodies unless a parser middleware is installed, and the
 * default `express.json()` only recognizes the literal `application/json`. The A2A Protocol
 * v1.0 wire format sends requests with `Content-Type: application/a2a+json` (an RFC 6839
 * structured `+json` suffix), so a plain `express.json()` would drop v1 bodies and the A2A
 * handler would see nothing — surfacing as `Method not found: undefined`.
 *
 * This wraps `express.json()` with a `type` matcher that also accepts any `application/*+json`
 * media type. Mount it before `MastraServer` so Mastra's routes receive parsed bodies:
 *
 * ```ts
 * import express from 'express';
 * import { MastraServer, mastraJsonBodyParser } from '@mastra/express';
 *
 * const app = express();
 * app.use(mastraJsonBodyParser());
 * await new MastraServer({ app, mastra }).init();
 * ```
 *
 * It is a thin wrapper, so it composes with (or replaces) your own `express.json()`; if a body
 * has already been parsed upstream, `express.json()` leaves it untouched.
 */
export function mastraJsonBodyParser(options: MastraJsonBodyParserOptions = {}): RequestHandler {
  return express.json({
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
    // Accept `application/json` plus any structured `+json` suffix type (RFC 6839),
    // e.g. the A2A v1 wire type `application/a2a+json`.
    type: ['application/json', 'application/*+json'],
  });
}
