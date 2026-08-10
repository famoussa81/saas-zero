"use client";

import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";

// =============================================================================
// MDX component map — Basic HTML element overrides for CMS content
// =============================================================================
type MDXComponentProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  src?: string;
  alt?: string;
  poster?: string;
  [key: string]: unknown;
};

export const components: Record<
  string,
  React.ComponentType<MDXComponentProps>
> = {
  h1: ({ children }) => (
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-6">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl md:text-3xl font-display font-semibold text-foreground mt-8 mb-3">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-lg text-muted-foreground leading-relaxed mb-6">
      {children}
    </p>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-primary hover:underline transition-colors"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-2 mb-6 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-2 mb-6 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-6 italic text-muted-foreground my-6">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">
          {children}
        </code>
      );
    }
    const language = className?.replace("language-", "") || "";
    return (
      <div className="relative group my-6">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => navigator.clipboard.writeText(String(children))}
            className="px-2 py-1 text-xs bg-muted/80 backdrop-blur-sm rounded hover:bg-muted text-muted-foreground transition-colors"
          >
            Copy
          </button>
        </div>
        <pre className="bg-muted/50 backdrop-blur-sm border border-border rounded-lg p-4 overflow-x-auto">
          <code className={`language-${language} text-sm`}>{children}</code>
        </pre>
      </div>
    );
  },
  pre: ({ children }) => (
    <div className="relative group my-6">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => navigator.clipboard.writeText(String(children))}
          className="px-2 py-1 text-xs bg-muted/80 backdrop-blur-sm rounded hover:bg-muted text-muted-foreground transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="bg-muted/50 backdrop-blur-sm border border-border rounded-lg p-4 overflow-x-auto">
        {children}
      </pre>
    </div>
  ),
  img: ({ src, alt, ...props }) => (
    <div className="my-8">
      <Image
        src={src || ""}
        alt={alt || ""}
        className="rounded-lg shadow-lg w-full h-auto"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        {...props}
      />
      {alt && (
        <p className="text-center text-sm text-muted-foreground mt-2">{alt}</p>
      )}
    </div>
  ),
  video: ({ src, poster, ...props }) => (
    <div className="my-8 rounded-lg overflow-hidden border border-border">
      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-auto"
        {...props}
      />
    </div>
  ),
  hr: () => <hr className="border-border my-12" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-8">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border px-4 py-3 text-left font-semibold bg-muted">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-4 py-3">{children}</td>
  ),
};

export function MDXComponents({
  source,
  components: overrides,
}: {
  source: string;
  components?: Record<string, React.ComponentType<MDXComponentProps>>;
}) {
  return (
    <div className="prose prose-slate max-w-none">
      <MDXRemote source={source} components={{ ...components, ...overrides }} />
    </div>
  );
}
