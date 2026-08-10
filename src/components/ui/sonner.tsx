"use client";

import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
  useSonner,
} from "sonner";

export type Toast = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

export function useToast() {
  const { toasts } = useSonner();

  return {
    toast: ({ title, description, variant = "default", ...props }: Toast) => {
      const options: Record<string, unknown> = {
        description,
        ...props,
      };

      // Map variant to sonner's toast types
      switch (variant) {
        case "destructive":
          return sonnerToast.error(title, options);
        case "success":
          return sonnerToast.success(title, options);
        case "warning":
          return sonnerToast.warning(title, options);
        case "info":
          return sonnerToast.info(title, options);
        default:
          return sonnerToast(title, options);
      }
    },
    dismiss: sonnerToast.dismiss,
    toasts,
  };
}

export function Toaster({
  ...props
}: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { sonnerToast as toast };
