/**
 * The JSON body parser must treat structured `+json` suffix media types (RFC 6839) as JSON,
 * not just the literal `application/json`. The A2A v1 wire type is `application/a2a+json`;
 * without `+json` handling, v1 requests reach the A2A handler with an empty body — surfacing
 * as `Method not found: undefined`.
 *
 * Koa does not parse bodies itself, so `mastraJsonBodyParser()` is the supported way to get
 * `+json` support; this test drives the adapter through it.
 */
import type { Server } from 'node:http';
import type { AdapterTestContext } from '@internal/server-adapter-test-utils';
import { createDefaultTestContext } from '@internal/server-adapter-test-utils';
import { InMemoryTaskStore } from '@mastra/server/a2a/store';
import Koa from 'koa';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MastraServer, mastraJsonBodyParser } from '../index';

describe('A2A v1 application/a2a+json request bodies (via mastraJsonBodyParser)', () => {
  let context: AdapterTestContext;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    context = await createDefaultTestContext();
    const app = new Koa();
    app.use(mastraJsonBodyParser());
    await new MastraServer({
      app,
      mastra: context.mastra,
      tools: context.tools,
      // createDefaultTestContext does not build one; the A2A handler needs a real store.
      taskStore: new InMemoryTaskStore(),
    }).init();

    server = await new Promise<Server>(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close(err => (err ? reject(err) : resolve())));
  });

  const sendMessage = (contentType: string) =>
    fetch(`${baseUrl}/api/a2a/test-agent`, {
      method: 'POST',
      headers: { 'content-type': contentType, 'A2A-Version': '1.0' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'SendMessage',
        params: {
          message: {
            messageId: 'm1',
            kind: 'message',
            role: 'user',
            parts: [{ kind: 'text', text: 'ping' }],
          },
        },
      }),
    });

  it('parses the body sent with application/a2a+json and reaches a successful result', async () => {
    const response = await sendMessage('application/a2a+json');
    const result = await response.json();

    // The body was parsed end to end: the JSON-RPC method is read and the send succeeds.
    expect(result.error).toBeUndefined();
    expect(result.result).toBeDefined();
  });

  it('matches the behavior of a plain application/json body', async () => {
    const [a2a, plain] = await Promise.all([
      sendMessage('application/a2a+json').then(r => r.json()),
      sendMessage('application/json').then(r => r.json()),
    ]);

    // Both content types reach the same successful handler outcome; neither is dropped.
    expect(a2a.error).toBeUndefined();
    expect(plain.error).toBeUndefined();
  });
});
