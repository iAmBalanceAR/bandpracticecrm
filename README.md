# CometDocs

A lightweight documentation system for Next.js applications.

Visit the [GitHub Repository](https://github.com/iAmBalanceAR/CometDocs) for the latest updates and source code.

## Features

- 📝 Markdown & MDX support
- 🎨 Clean, modern design
- 🔍 Full-text search
- 📱 Mobile-first responsive layout
- 🌙 Dark mode support
- 📖 Simple documentation structure

## Quick Start

```bash
# Install with your preferred package manager
npm install cometdocs
# or
yarn add cometdocs
# or
pnpm add cometdocs
```

Create your documentation directory:

```bash
mkdir -p docs/en
```

Add your first documentation file:

```md
---
title: Welcome
synopsis: Welcome to your documentation
position: 1
---

# Welcome

This is your first documentation page.
```

Create the documentation route:

```tsx
// app/docs/[[...slug]]/page.tsx
import { CometDocs } from 'cometdocs';

interface DocsPageProps {
  params: {
    slug: string[];
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const slug = params?.slug?.join('/') || 'index';
  
  return <CometDocs slug={slug} />;
}
```

## Example Build

You can find a complete example implementation in the `/example` directory. This example shows:
  
- Full documentation site setup
  
- Custom templates
- Markdown style guide
- Writing guidelines
- Configuration examples

To run the example:

```bash
cd example
pnpm install
pnpm dev
```

Then visit `http://localhost:3000/docs` to see it in action.

## Documentation

Visit our [documentation site](https://github.com/iAmBalanceAR/CometDocs/tree/main/example/docs/en) to learn more about:

- [Getting Started](/docs/guides/getting-started)
- [Installation](/docs/guides/installation)
- [Configuration](/docs/guides/configuration)
- [Writing Guide](/docs/guides/writing)

## Requirements

- Next.js 14 or higher
- Node.js 18.17 or higher
- React 18 or higher

## License

MIT © CometDocs
