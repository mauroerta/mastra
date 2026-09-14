import { Mastra } from '@mastra/core';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { MastraServer } from '../index';

/**
 * The request-body parser must treat structured `+json` suffix media types (RFC 6839) as
 * JSON, not just the literal `application/json`. The A2A v1 wire type is
 * `application/a2a+json`; before this was handled, v1 requests slipped past the parser and
 * reached handlers with an empty body — surfacing downstream as `Method not found: undefined`.
 */
describe('JSON request bodies with +json suffix content types', () => {
  const buildApp = async () => {
    const mastra = new Mastra({
      logger: false,
      server: {
        apiRoutes: [
          {
            method: 'POST',
            path: '/echo',
            handler: async c => c.json({ received: await c.req.json() }),
          },
        ],
      },
    });

    const app = new Hono();
    await new MastraServer({ app, mastra }).init();
    return app;
  };

  const post = (app: Hono, contentType: string) =>
    app.request('http://localhost/echo', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: JSON.stringify({ hello: 'world' }),
    });

  it('parses a plain application/json body', async () => {
    const response = await post(await buildApp(), 'application/json');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: { hello: 'world' } });
  });

  it('parses an A2A v1 application/a2a+json body', async () => {
    const response = await post(await buildApp(), 'application/a2a+json');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: { hello: 'world' } });
  });

  it('parses a body when the content type carries parameters', async () => {
    const response = await post(await buildApp(), 'application/a2a+json; charset=utf-8');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: { hello: 'world' } });
  });
});
