# @mastra/koa

Koa server adapter for Mastra, enabling you to run Mastra with the [Koa](https://koajs.com) framework.

## Installation

```bash
npm install @mastra/koa
```

## Usage

```typescript
import Koa from 'koa';
import { MastraServer, mastraJsonBodyParser } from '@mastra/koa';
import { mastra } from './mastra';

const app = new Koa();
// Parses JSON request bodies, including A2A v1's `application/a2a+json`.
app.use(mastraJsonBodyParser());

const server = new MastraServer({ app, mastra });

await server.init();

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

> **A2A v1:** Koa does not parse request bodies on its own, and common parsers such as
> `koa-bodyparser` accept only `application/json` by default. A2A Protocol v1.0 sends
> `Content-Type: application/a2a+json`, so use `mastraJsonBodyParser()` (or extend your parser's
> accepted types to include `application/*+json`) to avoid `Method not found: undefined`.

## Documentation

- [Koa adapter reference](https://mastra.ai/reference/server/koa-adapter)

## Changelog

See the [package changelog](https://github.com/mastra-ai/mastra/blob/main/server-adapters/koa/CHANGELOG.md) for version history and release notes.

## Support

We have an [open community Discord](https://discord.gg/mastra-ai). Come and say hello and let us know if you have any questions or need any help getting things running.
