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

  // Search posts
  for (const post of posts) {
    const searchable =
      `${post.title} ${post.description} ${post.tags?.join(" ") || ""} ${post.body.raw}`.toLowerCase();
    if (searchable.includes(searchTerm)) {
      results.push({
        url: `/blog/${post.slug}`,
        title: post.title,
        content: post.description,
        excerpt: post.description,
        type: "post",
      });
    }
  }

  // Search pages
  for (const page of pages) {
    const searchable =
      `${page.title} ${page.description} ${page.body.raw}`.toLowerCase();
    if (searchable.includes(searchTerm)) {
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
