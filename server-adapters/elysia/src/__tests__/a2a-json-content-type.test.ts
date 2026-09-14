/**
 * The request-body parser must treat structured `+json` suffix media types (RFC 6839) as
 * JSON, not just the literal `application/json`. The A2A v1 wire type is
 * `application/a2a+json`; before this was handled, v1 requests slipped past the parser and
 * reached the A2A handler with an empty body — surfacing as `Method not found: undefined`.
 */
import type { AdapterTestContext } from '@internal/server-adapter-test-utils';
import { createDefaultTestContext } from '@internal/server-adapter-test-utils';
import { InMemoryTaskStore } from '@mastra/server/a2a/store';
import { Elysia } from 'elysia';
import { beforeEach, describe, expect, it } from 'vitest';

import { MastraServer } from '../index';

describe('A2A v1 application/a2a+json request bodies', () => {
  let context: AdapterTestContext;
  let app: Elysia;

  beforeEach(async () => {
    context = await createDefaultTestContext();
    app = new Elysia();
    await new MastraServer({
      app,
      mastra: context.mastra,
      tools: context.tools,
      // createDefaultTestContext does not build one; the A2A handler needs a real store.
      taskStore: new InMemoryTaskStore(),
    }).init();
  });

  const sendMessage = (contentType: string) =>
    app.fetch(
      new Request('http://localhost/api/a2a/test-agent', {
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
      }),
    );

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
