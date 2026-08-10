import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("content", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Mock the generated content
  const mockPosts = [
    {
      slug: "post-1",
      title: "Post 1",
      date: "2024-01-15",
      draft: false,
      content: "Content 1",
    },
    {
      slug: "post-2",
      title: "Post 2",
      date: "2024-01-20",
      draft: true,
      content: "Content 2",
    },
    {
      slug: "post-3",
      title: "Post 3",
      date: "2024-01-10",
      draft: false,
      content: "Content 3",
    },
  ];

  const mockPages = [
    {
      slug: "page-1",
      title: "Page 1",
      order: 2,
      hidden: false,
      content: "Page 1",
    },
    {
      slug: "page-2",
      title: "Page 2",
      order: 1,
      hidden: false,
      content: "Page 2",
    },
    {
      slug: "page-3",
      title: "Page 3",
      order: 3,
      hidden: true,
      content: "Page 3",
    },
  ];

  const mockComponents = [
    { slug: "comp-1", title: "Component 1", description: "Desc 1" },
    { slug: "comp-2", title: "Component 2", description: "Desc 2" },
  ];

  beforeEach(() => {
    vi.mock("../src/lib/content/generated", () => ({
      allPosts: mockPosts,
      allPages: mockPages,
      allComponents: mockComponents,
      Post: {},
      Page: {},
      Component: {},
    }));
  });

  describe("getAllPosts", () => {
    it("returns only non-draft posts sorted by date descending", async () => {
      const { getAllPosts } = await import("@/lib/content");
      const posts = await getAllPosts();

      expect(posts).toHaveLength(2);
      expect(posts.map((p) => p.slug)).toEqual(["post-1", "post-3"]);
    });
  });

  describe("getPostBySlug", () => {
    it("returns post by slug", async () => {
      const { getPostBySlug } = await import("@/lib/content");
      const post = await getPostBySlug("post-1");

      expect(post).not.toBeNull();
      expect(post?.slug).toBe("post-1");
      expect(post?.title).toBe("Post 1");
    });

    it("returns null for non-existent slug", async () => {
      const { getPostBySlug } = await import("@/lib/content");
      const post = await getPostBySlug("non-existent");

      expect(post).toBeNull();
    });

    it("returns draft posts when queried by slug", async () => {
      const { getPostBySlug } = await import("@/lib/content");
      const post = await getPostBySlug("post-2");

      expect(post).not.toBeNull();
      expect(post?.draft).toBe(true);
    });
  });

  describe("getAllPages", () => {
    it("returns only non-hidden pages sorted by order", async () => {
      const { getAllPages } = await import("@/lib/content");
      const pages = await getAllPages();

      expect(pages).toHaveLength(2);
      expect(pages.map((p) => p.slug)).toEqual(["page-2", "page-1"]);
    });
  });

  describe("getPageBySlug", () => {
    it("returns page by slug", async () => {
      const { getPageBySlug } = await import("@/lib/content");
      const page = await getPageBySlug("page-1");

      expect(page).not.toBeNull();
      expect(page?.slug).toBe("page-1");
    });

    it("returns null for non-existent slug", async () => {
      const { getPageBySlug } = await import("@/lib/content");
      const page = await getPageBySlug("non-existent");

      expect(page).toBeNull();
    });

    it("returns hidden pages when queried by slug", async () => {
      const { getPageBySlug } = await import("@/lib/content");
      const page = await getPageBySlug("page-3");

      expect(page).not.toBeNull();
      expect(page?.hidden).toBe(true);
    });
  });

  describe("getAllComponents", () => {
    it("returns all components", async () => {
      const { getAllComponents } = await import("@/lib/content");
      const components = await getAllComponents();

      expect(components).toHaveLength(2);
      expect(components.map((c) => c.slug)).toEqual(["comp-1", "comp-2"]);
    });
  });

  describe("getComponentBySlug", () => {
    it("returns component by slug", async () => {
      const { getComponentBySlug } = await import("@/lib/content");
      const component = await getComponentBySlug("comp-1");

      expect(component).not.toBeNull();
      expect(component?.slug).toBe("comp-1");
    });

    it("returns null for non-existent slug", async () => {
      const { getComponentBySlug } = await import("@/lib/content");
      const component = await getComponentBySlug("non-existent");

      expect(component).toBeNull();
    });
  });

  describe("getAllContent", () => {
    it("returns all posts, pages, and components", async () => {
      const { getAllContent } = await import("@/lib/content");
      const { posts, pages, components } = await getAllContent();

      expect(posts).toHaveLength(2);
      expect(pages).toHaveLength(2);
      expect(components).toHaveLength(2);
    });
  });
});
