import type { Context, Middleware, Next } from 'koa';

/**
 * Options for {@link mastraJsonBodyParser}.
 */
export interface MastraJsonBodyParserOptions {
  /**
   * Maximum request body size in bytes. Bodies larger than this are rejected with 413.
   * @default 4.5 * 1024 * 1024 (4.5mb)
   */
  limit?: number;
}

const DEFAULT_LIMIT = 4.5 * 1024 * 1024;

/**
 * Whether a content type should be parsed as JSON: the literal `application/json` plus any
 * structured `+json` suffix media type (RFC 6839), e.g. the A2A v1 wire type
 * `application/a2a+json`.
 */
function isJsonContentType(contentType: string): boolean {
  return contentType.includes('application/json') || contentType.includes('+json');
}

/**
 * A drop-in JSON body parser for Mastra's Koa adapter.
 *
 * Koa does not parse request bodies at all, so the adapter relies on a body parser being
 * mounted (its `getParams` reads `ctx.request.body`). The common `koa-bodyparser` only
 * recognizes the literal `application/json` unless configured otherwise, so it would drop A2A
 * Protocol v1.0 requests, which arrive as `Content-Type: application/a2a+json` (an RFC 6839
 * structured `+json` suffix) — surfacing as `Method not found: undefined`.
 *
 * This is a small self-contained parser (no extra dependency) that reads the request stream and
 * assigns the parsed value to `ctx.request.body` for any `application/*+json` media type. Mount
 * it before `MastraServer`:
 *
 * ```ts
 * import Koa from 'koa';
 * import { MastraServer, mastraJsonBodyParser } from '@mastra/koa';
 *
 * const app = new Koa();
 * app.use(mastraJsonBodyParser());
 * await new MastraServer({ app, mastra }).init();
 * ```
 *
 * It skips multipart requests (the adapter parses those itself) and requests whose body has
 * already been populated by an upstream parser, so it composes with an existing setup.
 */
export function mastraJsonBodyParser(options: MastraJsonBodyParserOptions = {}): Middleware {
  const limit = options.limit ?? DEFAULT_LIMIT;

  return async function mastraJsonBodyParserMiddleware(ctx: Context, next: Next): Promise<void> {
    const contentType = ctx.headers['content-type'] || '';

    // Leave multipart to the adapter's own busboy handling, and don't clobber a body that an
    // upstream parser already populated.
    const alreadyParsed = (ctx.request as { body?: unknown }).body !== undefined;
    if (
      alreadyParsed ||
      contentType.includes('multipart/form-data') ||
      !isJsonContentType(contentType) ||
      !['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)
    ) {
      await next();
      return;
    }

    const raw = await readBody(ctx, limit);
    if (raw === undefined) {
      // Body too large.
      ctx.status = 413;
      ctx.body = { error: 'Request body too large' };
      return;
    }

    if (raw.trim().length > 0) {
      try {
        (ctx.request as { body?: unknown }).body = JSON.parse(raw);
      } catch {
        ctx.status = 400;
        ctx.body = { error: 'Invalid JSON body' };
        return;
      }
    }

    await next();
  };
}

/**
 * Read the raw request body as a string, enforcing a byte limit. Returns `undefined` if the
 * limit is exceeded.
 */
function readBody(ctx: Context, limit: number): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let aborted = false;

    ctx.req.on('data', (chunk: Buffer) => {
      if (aborted) return;
      size += chunk.length;
      if (size > limit) {
        aborted = true;
        resolve(undefined);
        return;
      }
      chunks.push(chunk);
    });
    ctx.req.on('end', () => {
      if (aborted) return;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    ctx.req.on('error', err => {
      if (aborted) return;
      reject(err);
    });
  });
}
