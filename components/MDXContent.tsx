"use client";

import { MDXRemote } from "next-mdx-remote/rsc";
import { components } from "./MDXComponents";

interface MDXContentProps {
  source: string;
}

export function MDXContent({ source }: MDXContentProps) {
  return <MDXRemote source={source} components={components} />;
}
