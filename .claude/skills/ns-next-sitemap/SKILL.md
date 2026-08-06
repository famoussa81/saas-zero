---
name: ns-next-sitemap
description: next-sitemap for automatic sitemap.xml and robots.txt generation. Generates sitemap.xml, robots.txt, and provides SEO configuration.
---

# next-sitemap - Automatic Sitemap Generation

## Installation

```bash
npm install next-sitemap
```

## Configuration

```javascript
// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://notresite.com",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ["/server-sitemap.xml"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/api/", "/admin/", "/private/"] },
    ],
    additionalSitemaps: ["https://notresite.com/server-sitemap.xml"],
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: {
        fr: `/fr${path}`,
        en: `/en${path}`,
      },
    };
  },
  additionalPaths: async () => [
    { loc: "/fr", changefreq: "daily", priority: 1.0 },
    { loc: "/en", changefreq: "daily", priority: 1.0 },
    { loc: "/fr/blog", changefreq: "daily", priority: 0.8 },
    { loc: "/en/blog", changefreq: "daily", priority: 0.8 },
  ],
};
```

## Package.json Scripts

```json
{
  "scripts": {
    "build": "next build && next-sitemap",
    "postbuild": "next-sitemap"
  }
}
```

## Next.js Integration

### Sitemap Generation

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { getAllPosts, getAllPages } from '@/lib/content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages] = await Promise.all([
    getAllPosts(),
    getAllPages()
  ])

  const baseUrl = 'https://notresite.com'
  const locales = ['fr', 'en']

  const staticUrls = locales.flatMap(locale => [
    { url: `${baseUrl}/${locale}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/${locale}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  })

  const postUrls = posts.flatMap(post =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  )

  const pageUrls = getAllPages().flatMap(page =>
    ['fr', 'en'].map(locale => ({
      url: `${baseUrl}/${locale}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  )

  return [...staticUrls, ...postUrls, ...pageUrls]
}
```

### Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/private/", "/tmp/"],
    },
    sitemap: "https://notresite.com/sitemap.xml",
    host: "https://notresite.com",
  };
}
```

## Internationalization Support

```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: "https://notresite.com",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  alternateUrls: {
    fr: "https://notresite.com/fr",
    en: "https://notresite.com/en",
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: {
        fr: `/fr${path}`,
        en: `/en${path}`,
      },
    };
  },
};
```

## Dynamic Sitemap for Large Sites

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";
import { getAllPosts, getAllPages } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://notresite.com";
  const locales = ["fr", "en"];

  const staticPages = [
    "",
    "/blog",
    "/a-propos",
    "/contact",
    "/tarifs",
    "/mentions-legales",
    "/politique-confidentialite",
  ];

  const staticUrls = staticPages.flatMap((path) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: path === "" ? 1.0 : 0.8,
    })),
  );

  const posts = await getAllPosts();
  const postUrls = posts.flatMap((post) =>
    ["fr", "en"].map((locale) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  );

  const pages = await getAllPages();
  const pageUrls = pages.flatMap((page) =>
    ["fr", "en"].map((locale) => ({
      url: `${baseUrl}/${locale}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  );

  return [...staticUrls, ...postUrls, ...pageUrls];
}
```

## Robots.txt Configuration

```typescript
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/", "/tmp/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
      },
    ],
    sitemap: "https://notresite.com/sitemap.xml",
    host: "https://notresite.com",
  };
}
```

## Advanced Configuration

```javascript
// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://notresite.com",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ["/server-sitemap.xml"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/api/", "/admin/", "/private/"] },
    ],
    additionalSitemaps: ["https://notresite.com/server-sitemap.xml"],
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: {
        fr: `/fr${path}`,
        en: `/en${path}`,
      },
    };
  },
  additionalPaths: async () => [
    { loc: "/fr", changefreq: "daily", priority: 1.0 },
    { loc: "/en", changefreq: "daily", priority: 1.0 },
    { loc: "/fr/blog", changefreq: "daily", priority: 0.8 },
    { loc: "/en/blog", changefreq: "daily", priority: 0.8 },
  ],
};
```

## Package.json Scripts

```json
{
  "scripts": {
    "build": "next build && next-sitemap",
    "postbuild": "next-sitemap"
  }
}
```

## Sitemap Index

```xml
<!-- sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://notresite.com/sitemap-0.xml</loc>
    <lastmod>2024-01-15T10:30:00.000Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://notresite.com/sitemap-1.xml</loc>
    <lastmod>2024-01-15T10:30:00.000Z</lastmod>
  </sitemap>
</sitemapindex>
```

## Individual Sitemap

```xml
<!-- sitemap-0.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://notresite.com/fr</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="https://notresite.com/fr"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://notresite.com/en"/>
  </url>
  <url>
    <loc>https://notresite.com/fr/blog/mon-article</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="https://notresite.com/fr/blog/mon-article"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://notresite.com/en/blog/mon-article"/>
  </url>
</urlset>
```

## Robots.txt Output

```txt
# robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /tmp/

Sitemap: https://notresite.com/sitemap.xml
Host: https://notresite.com
```

## Integration with Next.js Build

```json
{
  "scripts": {
    "build": "next build && next-sitemap",
    "postbuild": "next-sitemap"
  }
}
```

## TypeScript Types

```typescript
// types/next-sitemap.d.ts
declare module "next-sitemap" {
  export interface IConfig {
    siteUrl: string;
    generateRobotsTxt?: boolean;
    generateIndexSitemap?: boolean;
    exclude?: string[];
    robotsTxtOptions?: {
      policies: Array<{
        userAgent: string;
        allow?: string[];
        disallow?: string[];
      }>;
      additionalSitemaps?: string[];
    };
    transform?: (config: any, path: string) => any;
    additionalPaths?: () => Promise<
      Array<{
        loc: string;
        changefreq?: string;
        priority: number;
      }>
    >;
  }
}
```

## Resources

- [next-sitemap Documentation](https://github.com/iamvishnusankar/next-sitemap)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
