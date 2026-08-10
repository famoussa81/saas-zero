import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
    heroVideo: z.string().optional(),
    author: z.string().optional(),
    draft: z.boolean().default(false),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    });

    const wordsPerMinute = 200;
    const words = document.content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);

    return {
      ...document,
      slug: document._meta.path.replace("posts/", "").replace(/\.mdx$/, ""),
      readingTime: `${minutes} min read`,
      body: { raw: document.content, mdx },
    };
  },
});

const pages = defineCollection({
  name: "pages",
  directory: "content/pages",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heroImage: z.string().optional(),
    heroVideo: z.string().optional(),
    order: z.number().default(0),
    hidden: z.boolean().default(false),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    });

    return {
      ...document,
      slug: document._meta.path.replace("pages/", "").replace(/\.mdx$/, ""),
      body: { raw: document.content, mdx },
    };
  },
});

const components = defineCollection({
  name: "components",
  directory: "content/components",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    });

    return {
      ...document,
      slug: document._meta.path
        .replace("components/", "")
        .replace(/\.mdx$/, ""),
      body: { raw: document.content, mdx },
    };
  },
});

export default defineConfig({
  collections: [posts, pages, components],
});
