---
name: ns-json-ld
description: JSON-LD structured data for SEO. Implements Schema.org structured data for rich snippets, knowledge panels, and enhanced search results.
---

# JSON-LD Structured Data

JSON-LD (JavaScript Object Notation for Linked Data) is a method of encoding Linked Data using JSON. It's the recommended format for structured data by Google.

## Installation

No installation required - uses native Next.js Metadata API.

## Basic Usage

```tsx
// app/[locale]/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notre Site",
  description: "Description du site",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://notresite.com",
    siteName: "Notre Site",
    title: "Notre Site",
    description: "Description du site",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Notre Site",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notre Site",
    description: "Description du site",
    images: ["/images/og-image.jpg"],
  },
  other: {
    "script:ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Notre Site",
      url: "https://notresite.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://notresite.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    }),
  },
};
```

## Schema.org Types

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Notre Société",
  "url": "https://notresite.com",
  "logo": "https://notresite.com/logo.png",
  "sameAs": [
    "https://twitter.com/notresite",
    "https://linkedin.com/company/notresite",
    "https://github.com/notresite"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+33-1-23-45-67-89",
    "contactType": "customer service",
    "availableLanguage": ["French", "English"]
  }
}
```

### WebSite

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Notre Site",
  "url": "https://notresite.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://notresite.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### WebPage / Article

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Titre de l'article",
  "description": "Description de l'article",
  "image": "https://notresite.com/images/article.jpg",
  "author": {
    "@type": "Person",
    "name": "Jean Dupont",
    "url": "https://notresite.com/auteur/jean-dupont"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Notre Société",
    "logo": {
      "@type": "ImageObject",
      "url": "https://notresite.com/logo.png"
    }
  },
  "datePublished": "2024-01-15T10:00:00+01:00",
  "dateModified": "2024-01-15T10:00:00+01:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://notresite.com/fr/blog/mon-article"
  }
}
```

### Product

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Notre Produit",
  "description": "Description du produit",
  "brand": {
    "@type": "Brand",
    "name": "Notre Marque"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://notresite.com/produit",
    "price": "29.00",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Notre Société"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://notresite.com/fr"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://notresite.com/fr/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Mon Article",
      "item": "https://notresite.com/fr/blog/mon-article"
    }
  ]
}
```

### FAQPage

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment puis-je commencer ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Inscrivez-vous gratuitement en 2 minutes. Aucune carte bancaire requise."
      }
    },
    {
      "@type": "Question",
      "name": "Puis-je annuler mon abonnement ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui, vous pouvez annuler à tout moment depuis les paramètres."
      }
    }
  ]
}
```

### LocalBusiness

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Notre Société",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Rue de la Tech",
    "addressLocality": "Paris",
    "postalCode": "75001",
    "addressCountry": "FR"
  },
  "telephone": "+33-1-23-45-67-89",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "priceRange": "€€",
  "currenciesAccepted": "EUR",
  "paymentAccepted": "Credit Card, Bank Transfer"
}
```

## Implementation in Next.js

```tsx
// lib/schema.ts
import { Metadata } from "next";

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Notre Société",
    url: "https://notresite.com",
    logo: "https://notresite.com/logo.png",
    sameAs: [
      "https://twitter.com/notresite",
      "https://linkedin.com/company/notresite",
    ],
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Notre Site",
    url: "https://notresite.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://notresite.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  image: string;
  author: string;
  datePublished: string;
  dateModified: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image,
    author: {
      "@type": "Person",
      name: article.author,
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
```

## Usage in Pages

```tsx
// app/[locale]/page.tsx
import { Metadata } from "next";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/schema";

export const metadata: Metadata = {
  title: "Accueil",
  description: "Description de la page d'accueil",
  other: {
    "script:ld+json": JSON.stringify([
      generateOrganizationSchema(),
      generateWebSiteSchema(),
    ]),
  },
};

export default function HomePage() {
  return <main>Contenu de la page</main>;
}
```

```tsx
// app/[locale]/blog/[slug]/page.tsx
import { Metadata } from "next";
import { getPostBySlug } from "@/lib/content";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/schema";

interface Props {
  params: { locale: string; slug: string };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Article non trouvé" };

  const breadcrumbs = [
    { name: "Accueil", url: "https://notresite.com/fr" },
    { name: "Blog", url: "https://notresite.com/fr/blog" },
    { name: post.title, url: `https://notresite.com/fr/blog/${post.slug}` },
  ];

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      images: post.heroImage ? [post.heroImage] : [],
    },
    other: {
      "script:ld+json": JSON.stringify([
        generateArticleSchema({
          title: post.title,
          description: post.description,
          image: post.heroImage || "",
          author: post.author || "",
          datePublished: post.date,
          dateModified: post.date,
          url: `https://notresite.com/fr/blog/${post.slug}`,
        }),
        generateBreadcrumbSchema([
          { name: "Accueil", url: "https://notresite.com/fr" },
          { name: "Blog", url: "https://notresite.com/fr/blog" },
          {
            name: post.title,
            url: `https://notresite.com/fr/blog/${post.slug}`,
          },
        ]),
      ]),
    },
  };
}
```

## Testing Schema

```bash
# Test with Google Rich Results Test
# https://search.google.com/test/rich-results

# Test with Schema Markup Validator
# https://validator.schema.org/
```

## Validation

```bash
# Test with curl
curl -s "https://notresite.com/fr" | grep -A 50 'script type="application/ld+json"'

# Or use Google's Rich Results Test API
```

## Best Practices

1. **Use JSON-LD** - Preferred by Google
2. **Validate with tools** - Google Rich Results Test, Schema Markup Validator
3. **Keep data accurate** - Don't markup content not visible to users
4. **Use specific types** - Article, Product, Event, etc.
5. **Include required properties** - Check required fields for each type
6. **Test regularly** - Use Google Rich Results Test
7. **Monitor Search Console** - Check for errors in Enhancement reports
8. **Update when content changes** - Keep structured data in sync
