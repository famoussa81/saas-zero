"use client";

import * as React from "react";
import * as FormPrimitive from "@radix-ui/react-form";
import { cn } from "@/lib/utils";

const Form = FormPrimitive.Root;
const FormField = FormPrimitive.Field;
const FormItem = FormPrimitive.Field;
const FormLabel = FormPrimitive.Label;
const FormControl = FormPrimitive.Control;
const FormDescription = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn("text-sm text-muted-foreground", props.className)}
  >
    {children}
  </div>
);
const FormMessage = FormPrimitive.Message;

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
};
