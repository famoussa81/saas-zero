import * as React from "react";
import { cn } from "@/lib/utils";

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Pagination.displayName = "Pagination";

export { Pagination };
