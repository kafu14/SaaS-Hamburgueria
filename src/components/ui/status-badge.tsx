import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        new: "border-transparent bg-status-new text-white shadow animate-pulse-soft",
        preparing: "border-transparent bg-status-preparing text-white shadow animate-glow",
        ready: "border-transparent bg-status-ready text-white shadow animate-bounce-soft",
        served: "border-transparent bg-status-served text-white shadow",
        cancelled: "border-transparent bg-destructive text-destructive-foreground shadow",
        pending: "border-transparent bg-warning text-warning-foreground shadow",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-2 text-base font-bold",
      }
    },
    defaultVariants: {
      variant: "new",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, size, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant, size }), className)} {...props} />
  );
}

export { StatusBadge, statusBadgeVariants };