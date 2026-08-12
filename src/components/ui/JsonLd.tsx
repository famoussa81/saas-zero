// JSON-LD Structured Data Components
// Usage: Import and place in any component/page for SEO structured data

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization schema
export function OrganizationJsonLd() {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "SaaS Zero",
        url,
        logo: `${url}/images/logo.svg`,
        sameAs: [
          "https://twitter.com/saaszero",
          "https://github.com/saas-zero",
          "https://linkedin.com/company/saas-zero",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+33-1-23-45-67-89",
          contactType: "customer service",
          availableLanguage: ["French", "English"],
        },
      }}
    />
  );
}

// Website schema
export function WebsiteJsonLd() {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "SaaS Zero",
        url,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${url}/fr/recherche?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

// SoftwareApplication schema
export function SoftwareApplicationJsonLd() {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "SaaS Zero",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Cloud",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${url}/fr/inscription`,
        },
        description:
          "Complete SaaS starter kit with Next.js 14, Supabase, Stripe, and more. Build production-ready SaaS in 2 hours.",
        featureList: [
          "Authentication (Supabase Auth)",
          "Billing (Stripe)",
          "Real-time Dashboard",
          "Team Management (B2B)",
          "Internationalization (i18n)",
          "Quality Gates (13 deterministic checks)",
        ],
        screenshot: `${url}/images/dashboard-screenshot.png`,
        softwareVersion: "1.0.0",
        datePublished: "2026-01-01",
        author: {
          "@type": "Organization",
          name: "SaaS Zero Team",
        },
        publisher: {
          "@type": "Organization",
          name: "SaaS Zero",
        },
      }}
    />
  );
}

// Breadcrumb schema
export function BreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

// Article schema for blog posts
export function ArticleJsonLd({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  publisherName = "SaaS Zero",
  url,
}: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  publisherName?: string;
  url: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        image,
        datePublished,
        dateModified: dateModified || datePublished,
        author: {
          "@type": "Person",
          name: authorName,
        },
        publisher: {
          "@type": "Organization",
          name: publisherName,
          logo: {
            "@type": "ImageObject",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.svg`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
      }}
    />
  );
}

// FAQ schema
export function FaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return (
    <JsonLd
      data={{
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
      }}
    />
  );
}

// Product schema for pricing
export function ProductJsonLd({
  name,
  description,
  price,
  currency = "EUR",
  billingPeriod = "month",
  url,
  features = [],
}: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  billingPeriod?: "month" | "year";
  url: string;
  features?: string[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: currency,
          price,
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: currency,
            price,
            billingDuration: billingPeriod === "year" ? "P1Y" : "P1M",
            billingIncrement: billingPeriod === "year" ? "P1Y" : "P1M",
          },
        },
        featureList: features,
        brand: {
          "@type": "Brand",
          name: "SaaS Zero",
        },
      }}
    />
  );
}
