---
name: ns-contentlayer
description: Contentlayer CMS for markdown/MDX content management. Provides type-safe content layer with type generation, incremental builds, and MDX support.
---

# Contentlayer CMS

Contentlayer is a content SDK that validates and transforms your content into type-safe data you can import into your application.

## Installation

```bash
npm install contentlayer next-contentlayer
```

## Configuration

Create `contentlayer.config.ts` at the root of your project:

```typescript
import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'

const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    heroImage: { type: 'string', required: false },
    heroVideo: { type: 'string', required: false },
    author: { type: 'string', required: false },
    draft: { type: 'boolean', default: false },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath.replace('posts/', '') },
    readingTime: { type: 'string', resolve: (doc) => {
      const wordsPerMinute = 200
      const words = doc.body.raw.split(/\s+/).length
      const minutes = Math.ceil(words / wordsPerMinute)
      return `${minutes} min read`
    }},
  },
})

const Page = defineDocumentType(() => ({
  name: 'Page',
  filePathPattern: `pages/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    heroImage: { type: 'string', required: false },
    heroVideo: { type: 'string', required: false },
    order: { type: 'number', required: false, default: 0 },
    hidden: { type: 'boolean', default: false },
  },
  computedFields: {
    slug: { type: 'string', resolve: (doc) => doc._raw.flattenedPath.replace('pages/', '') },
  },
})

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Page],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    ],
  },
})
```

## Content Structure

```
content/
├── posts/
│   ├── mon-article.mdx
│   └── ...
├── pages/
│   ├── about.mdx
│   └── ...
├── components/
│   ├── Hero.mdx
│   └── ...
└── data/
    ├── navigation.yml
    └── settings.yml
```

## Frontmatter Examples

### Post

```mdx
---
title: "Mon article"
description: "Description courte"
date: "2024-01-15"
tags: ["tag1", "tag2"]
heroImage: "/images/article.jpg"
author: "Auteur"
draft: false
---

# Contenu de l'article
```

### Page

```mdx
---
title: "À propos"
description: "Page à propos"
heroImage: "/images/about.jpg"
order: 1
hidden: false
---

# Contenu de la page
```

## Usage in Components

```tsx
import { getAllPosts, getPostBySlug, getAllPages } from '@/lib/content'
import { MDXComponents } from '@/components/MDXComponents'

// In a page component
const posts = await getAllPosts()
const post = await getPostBySlug('mon-article')

// In a component
<MDXComponents components={components} source={post.body.raw} />
```

## MDX Components

Create `components/MDXComponents.tsx` for custom components:

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";

export const components = {
  h1: ({ children }) => <h1 className="text-4xl font-bold mb-4">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="text-3xl font-bold mt-8 mb-4">{children}</h2>
  ),
  // ... custom components
};

export function MDXComponents({ components, ...props }) {
  return <MDXRemote {...props} components={{ ...components, ...components }} />;
}
```

## Scripts

```json
{
  "scripts": {
    "dev": "contentlayer dev & next dev",
    "build": "contentlayer build && next build",
    "contentlayer:build": "contentlayer build",
    "contentlayer:dev": "contentlayer dev"
  }
}
```

## Type Generation

Contentlayer automatically generates TypeScript types in `.contentlayer/generated/`.

Import types:

```typescript
import type { Post, Page } from "contentlayer/generated";
```

## Best Practices

1. **Always use computed fields** for slugs, reading time, etc.
2. **Validate frontmatter** with required fields
3. **Use draft field** for unpublished content
4. **Organize content** in logical folders (posts/, pages/, components/)
5. **Use computed fields** for derived data
6. **Keep frontmatter consistent** across document types
7. **Use MDX components** for reusable UI elements
8. **Use TypeScript types** for type safety
9. **Validate frontmatter** with required fields
10. **Use draft field** for unpublished content
11. **Organize content** in logical folders
12. **Use MDX components** for reusable UI
13. **Validate frontmatter** with required fields
14. **Use draft field** for unpublished content
15. **Organize content** in logical folders
16. **Use MDX components** for reusable UI
