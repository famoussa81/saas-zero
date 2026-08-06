---
name: ns-pagefind
description: Pagefind static search for Next.js sites. Build-time search index generation, zero-runtime dependencies, instant search results.
---

# Pagefind - Static Search

Pagefind creates a search index at build time from your generated HTML, providing instant client-side search with zero server infrastructure.

## Installation

```bash
npm install pagefind
```

## Configuration

```javascript
// pagefind.config.js
module.exports = {
  site: ".next/server/app", // Path to built Next.js output
  output: "public/_pagefind", // Output directory
  glob: ["**/*.html"], // Files to index
  excludeSelectors: [
    "nav",
    "footer",
    "header",
    ".search",
    ".navigation",
    ".sidebar",
    ".cookie-banner",
  ],
  bundleDirectory: "_pagefind",
  forceLanguage: "fr", // Default language
  verbose: true,
  maxFileSize: 1048576, // 1MB max file size
};
```

## Integration with Next.js

```json
{
  "scripts": {
    "build": "next build && pagefind --site .next/server/app",
    "pagefind": "pagefind --site .next/server/app",
    "search:dev": "pagefind --site .next/server/app --port 8788"
  }
}
```

## Search Component

```tsx
// components/ui/Search.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SearchResult {
  url: string;
  title: string;
  content: string;
  excerpt?: string;
}

export function Search({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      document.body.style.overflow = "";
    }
  };

  return (
    <div className="relative">
      <label htmlFor="search" className="sr-only">
        Rechercher
      </label>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
          placeholder="Rechercher..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors"
            aria-label="Effacer la recherche"
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {query && isOpen && (
        <div
          id="search-results"
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
          role="listbox"
        >
          {loading && (
            <div className="p-4 text-center text-muted-foreground">
              Recherche en cours...
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-muted-foreground">
              Aucun résultat pour "{query}"
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul role="listbox" className="py-2">
              {results.map((result, index) => (
                <li key={result.url} role="option">
                  <a
                    href={result.url}
                    className="block px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-foreground">
                      {result.title}
                    </p>
                    {result.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {result.excerpt}
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

## API Route

```typescript
// app/api/search/route.ts
import { NextResponse } from "next/server";
import { getAllPosts, getAllPages } from "@/lib/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [posts, pages] = await Promise.all([getAllPosts(), getAllPages()]);

  const searchTerm = query.toLowerCase();
  const results = [];

  for (const post of getAllPosts()) {
    const searchable =
      `${post.title} ${post.description} ${post.tags?.join(" ") || ""} ${post.body.raw}`.toLowerCase();
    if (searchable.includes(query.toLowerCase())) {
      results.push({
        url: `/blog/${post.slug}`,
        title: post.title,
        content: post.description,
        excerpt: post.description,
        type: "post",
      });
    }
  }

  for (const page of getAllPages()) {
    const searchable =
      `${page.title} ${page.description} ${page.body.raw}`.toLowerCase();
    if (searchable.includes(query.toLowerCase())) {
      results.push({
        url: `/${page.slug}`,
        title: page.title,
        content: page.description,
        excerpt: page.description,
        type: "page",
      });
    }
  }

  return NextResponse.json({ results });
}
```

## Pagefind Configuration Options

| Option             | Type     | Default            | Description              |
| ------------------ | -------- | ------------------ | ------------------------ |
| `site`             | string   | Required           | Path to built site       |
| `output`           | string   | `public/_pagefind` | Output directory         |
| `glob`             | string[] | `['**/*.html']`    | Files to index           |
| `excludeSelectors` | string[] | `[]`               | CSS selectors to exclude |
| `bundleDirectory`  | string   | `_pagefind`        | Bundle output directory  |
| `forceLanguage`    | string   | Detected           | Force language           |
| `verbose`          | boolean  | `false`            | Verbose output           |
| `maxFileSize`      | number   | 1048576            | Max file size in bytes   |

## Excluding Content from Index

Add `data-pagefind-ignore` to elements you want to exclude:

```html
<nav data-pagefind-ignore>Navigation</nav>
<footer data-pagefind-ignore>Footer</footer>
<div class="search" data-pagepagefind-ignore>Search UI</div>
```

Or use `excludeSelectors` in config:

```javascript
excludeSelectors: [
  "nav",
  "footer",
  "header",
  ".search",
  ".navigation",
  ".sidebar",
  ".cookie-banner",
  ".newsletter-signup",
];
```

## Custom Search UI

```tsx
// Custom search with keyboard navigation
export function SearchWithKeyboard() {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        window.location.href = results[selectedIndex].url;
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results]);
}
```

## Build Integration

```bash
# Build and index
pnpm build

# This runs:
# 1. next build
# 2. pagefind --site .next/server/app
# 3. Copies _pagefind to public/
```

## Performance Tips

1. **Exclude unnecessary content** - Use `excludeSelectors` aggressively
2. **Limit indexed content** - Use `maxFileSize` to skip large pages
3. **Use `forceLanguage`** - Avoids language detection overhead
4. **Enable `verbose`** - Debug indexing issues
5. **Run in CI** - Integrate into CI/CD pipeline

## Troubleshooting

| Issue                | Solution                                  |
| -------------------- | ----------------------------------------- |
| No results found     | Check `glob` pattern matches built HTML   |
| Index too large      | Increase `maxFileSize` or add exclusions  |
| Wrong language       | Set `forceLanguage` explicitly            |
| Build fails          | Run with `verbose: true` for debug output |
| Results not updating | Clear `.pagefind` cache and rebuild       |

## Resources

- [Pagefind Documentation](https://pagefind.app/)
- [Pagefind GitHub](https://github.com/CloudCannon/pagefind)
- [Next.js Integration Example](https://github.com/CloudCannon/pagefind-nextjs-example)
