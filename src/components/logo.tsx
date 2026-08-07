import { Anchor } from "lucide-react";

import { cn } from "@/lib/utils";

function Logo({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-primary",
        className,
      )}
      {...props}
    >
      <Anchor className="size-[1em]" strokeWidth={3} />
      <span className="font-sans text-[1.5em] leading-none font-bold tracking-tight">
        Keel
      </span>
    </div>
  );
}

export { Logo };
