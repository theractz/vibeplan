import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium",
  {
    variants: {
      variant: {
        default: "border-amber-500/25 bg-amber-500/10 text-amber-300",
        secondary: "border-slate-800 bg-slate-900 text-slate-400",
        outline: "border-slate-800 bg-transparent text-slate-400",
        destructive: "border-red-900 bg-red-950 text-red-300",
        success: "border-emerald-900 bg-emerald-950 text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
