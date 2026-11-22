import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full resize-y rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-sm leading-relaxed text-slate-100 transition-colors placeholder:text-slate-600 focus-visible:border-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
