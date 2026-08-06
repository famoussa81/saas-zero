---
name: search-builder
description: Builds Pagefind static search integration with API route, search component, and build integration.
---

# Search Builder Agent

## Mission

Build complete Pagefind static search integration with API route, search component, and build integration for the website workflow.

## Inputs

- `SPEC.md` - Product specification
- `ARCHITECTURE-CHOICE.md` - Architecture decisions

## Outputs

- `components/ui/Search.tsx` - Search component with autocomplete
- `app/api/search/route.ts` - Search API route
- `scripts/build-search.js` - Pagefind build script
- `.claude/skills/ns-pagefind/SKILL.md` - Pagefind skill

## Phase 1: Search Component

### 1.1 Search Component

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

export function SearchButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label="Rechercher"
      aria-expanded={isOpen}
    >
      <svg
        className="w-5 h-5 text-muted-foreground"
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
    </button>
  );
}
```

## Phase 2: Search API Route

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

## Phase 3: Build Script

```javascript
// scripts/build-search.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function buildSearch() {
  console.log("Building search index with Pagefind...");

  try {
    // Run pagefind on the built Next.js output
    execSync("npx pagefind --site .next/server/app", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("Search index built successfully!");
  } catch (error) {
    console.error("Failed to build search index:", error);
    process.exit(1);
  }
}

buildSearch();
```

## Phase 4: Package.json Scripts

```json
{
  "scripts": {
    "build": "contentlayer build && pagefind --site .next/server/app && next build",
    "build:analyze": "ANALYZE=true next build",
    "pagefind": "pagefind --site .next/server/app",
    "search:dev": "pagefind --site .next/server/app --port 8788"
  }
}
```

## Phase 5: Integration in Ship.md

Add to ship.md Phase 3:

```markdown
### Phase 3.6: Search Integration

1. Install Pagefind: `npm install pagefind`
2. Add search component to header
3. Configure Pagefind in build process
4. Add search API route
5. Test search functionality
```

## Integration Checklist

- [ ] Install `pagefind` package
- [ ] Create `components/ui/Search.tsx`
- [ ] Create `app/api/search/route.ts`
- [ ] Add `scripts/build-search.js`
- [ ] Update `package.json` scripts
- [ ] Add Pagefind to build process
- [ ] Add search component to header
- [ ] Test search functionality
- [ ] Add to ship.md Phase 3
