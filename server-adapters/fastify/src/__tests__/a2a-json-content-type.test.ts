/**
 * The request-body parser must treat structured `+json` suffix media types (RFC 6839) as
 * JSON, not just the literal `application/json`. The A2A v1 wire type is
 * `application/a2a+json`; before this was handled, Fastify had no content-type parser
 * registered for it, so v1 requests reached the A2A handler with an empty body — surfacing
 * as `Method not found: undefined`.
 */
import type { AdapterTestContext } from '@internal/server-adapter-test-utils';
import { createDefaultTestContext } from '@internal/server-adapter-test-utils';
import { InMemoryTaskStore } from '@mastra/server/a2a/store';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MastraServer } from '../index';

describe('A2A v1 application/a2a+json request bodies', () => {
  let context: AdapterTestContext;
  let app: FastifyInstance;

  beforeEach(async () => {
    context = await createDefaultTestContext();
    app = Fastify();
    await new MastraServer({
      app,
      mastra: context.mastra,
      tools: context.tools,
      // createDefaultTestContext does not build one; the A2A handler needs a real store.
      taskStore: new InMemoryTaskStore(),
    }).init();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  const sendMessage = (contentType: string) =>
    app.inject({
      method: 'POST',
      url: '/api/a2a/test-agent',
      headers: { 'content-type': contentType, 'A2A-Version': '1.0' },
      payload: JSON.stringify({
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
    const result = response.json();

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
