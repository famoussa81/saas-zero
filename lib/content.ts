import {
  Post,
  Page,
  Component,
  allPosts,
  allPages,
  allComponents,
} from "@/.content-collections/generated";

export type { Post, Page, Component };

export async function getAllPosts(): Promise<Post[]> {
  return allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return allPosts.find((post) => post.slug === slug) || null;
}

export async function getAllPages(): Promise<Page[]> {
  return allPages
    .filter((page) => !page.hidden)
    .sort((a, b) => a.order - b.order);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  return allPages.find((page) => page.slug === slug) || null;
}

export async function getAllComponents(): Promise<Component[]> {
  return allComponents;
}

export async function getComponentBySlug(
  slug: string,
): Promise<Component | null> {
  return allComponents.find((c) => c.slug === slug) || null;
}

export async function getAllContent() {
  const [posts, pages, components] = await Promise.all([
    getAllPosts(),
    getAllPages(),
    getAllComponents(),
  ]);
  return { posts, pages, components };
}
