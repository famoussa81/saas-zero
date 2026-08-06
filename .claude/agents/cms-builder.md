---
name: cms-builder
description: Builds Contentlayer CMS setup with markdown/MDX content management, type generation, and MDX components.
---

# CMS Builder Agent

## Mission

Build a complete Contentlayer CMS setup with markdown/MDX content management, type generation, and MDX components for the website workflow.

## Inputs

- `SPEC.md` - Product specification
- `DESIGN-SPEC.md` - Design specification
- `ARCHITECTURE-CHOICE.md` - Architecture decisions

## Outputs

- `contentlayer.config.ts` - Contentlayer configuration
- `content/` - Content directory structure (posts, pages, components, data)
- `lib/content.ts` - Content fetching utilities
- `components/MDXComponents.tsx` - Custom MDX components
- `content/` - Sample content (posts, pages)

## Phase 1: Configuration

### 1.1 Create contentlayer.config.ts

```typescript
// contentlayer.config.ts
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

### 1.2 Content Structure

```
content/
├── posts/
│   ├── bienvenue.mdx
│   └── ...
├── pages/
│   ├── about.mdx
│   ├── contact.mdx
│   ├── politique-confidentialite.mdx
│   └── ...
├── components/
│   └── Hero.mdx
└── data/
    ├── navigation.yml
    └── settings.yml
```

### 1.3 lib/content.ts

```typescript
// lib/content.ts
import {
  getDocumentsByType,
  getDocumentBySlug,
  getAllDocuments,
} from "contentlayer/client";
import type { Post, Page } from "contentlayer/generated";

export async function getAllPosts(): Promise<Post[]> {
  const posts = await getDocumentsByType("Post");
  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    return await getDocumentBySlug("Post", slug);
  } catch {
    return null;
  }
}

export async function getAllPages(): Promise<Page[]> {
  const pages = await getDocumentsByType("Page");
  return pages.filter((page) => !page.hidden).sort((a, b) => a.order - b.order);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    return await getDocumentBySlug("Page", slug);
  } catch {
    return null;
  }
}
```

### 1.3 MDX Components

```tsx
// components/MDXComponents.tsx
import { MDXRemote } from 'next-mdx-remote/rsc'
import Image from 'next/image'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'

export const components = {
  h1: ({ children }) => <h1 className="text-4xl md:text-5xl font-bold mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-border">{children}</h2>,
  h3: ({ children }) => <h3 className="text-2xl font-semibold mt-8 mb-3">{children}</h3>,
  p: ({ children }) => <p className="text-lg text-muted-foreground leading-relaxed mb-6">{children}</p>,
  a: ({ href, children, ...props }) => (
    <a href={href} className="text-primary hover:underline" {...props}>{children}</a>
  ),
  ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-6">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-6 italic my-6">{children}</blockquote>,
  code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
  pre: ({ children }) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto">{children}</pre>,
  img: ({ src, alt, ...props }) => (
    <div className="my-8">
      <img src={src} alt={alt || ''} className="rounded-lg shadow-lg w-full h-auto" />
      {props.alt && <p className="text-center text-sm text-muted-foreground mt-2">{props.alt}</p>}
    </div>
  ),
  video: ({ src, poster, ...props }) => (
    <div className="my-8 rounded-lg overflow-hidden border border-border">
      <video src={src} poster={poster} autoPlay muted loop playsInline className="w-full h-auto" />
    </div>
  ),
  Hero: ({ title, description, cta, ctaHref, image, video }) => (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {(video || false) && (
        <video autoPlay muted loop playsInline poster="/hero-poster.jpg" className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/videos/hero.webm" type="video/webm" />
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
      )}
      {image && !video && <div className="absolute inset-0 z-0"><img src={image} alt="" className="w-full h-full object-cover" /></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10" />
      <div className="relative z-20 max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">{title}</h1>
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">{description}</p>
        {cta && ctaHref && <a href={ctaHref} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-full hover:bg-primary/90 transition-all hover:scale-105">{cta}</a>}
      </div>
    </section>
  ),
}
```
