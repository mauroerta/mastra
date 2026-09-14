# @mastra/express

Express server adapter for Mastra, enabling you to run Mastra with the [Express](https://expressjs.com) framework.

## Installation

```bash
npm install @mastra/express
```

## Usage

```typescript
import express from 'express';
import { MastraServer, mastraJsonBodyParser } from '@mastra/express';
import { mastra } from './mastra';

const app = express();
// Parses JSON request bodies, including A2A v1's `application/a2a+json`.
app.use(mastraJsonBodyParser());

const server = new MastraServer({ app, mastra });

await server.init();

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

> **A2A v1:** Express does not parse request bodies on its own, and a plain `express.json()`
> only accepts `application/json`. A2A Protocol v1.0 sends `Content-Type: application/a2a+json`,
> so use `mastraJsonBodyParser()` (or configure your own parser with
> `type: ['application/json', 'application/*+json']`) to avoid `Method not found: undefined`.

## Documentation

- [Express adapter reference](https://mastra.ai/reference/server/express-adapter)

## Changelog

See the [package changelog](https://github.com/mastra-ai/mastra/blob/main/server-adapters/express/CHANGELOG.md) for version history and release notes.

## Support

We have an [open community Discord](https://discord.gg/mastra-ai). Come and say hello and let us know if you have any questions or need any help getting things running.
