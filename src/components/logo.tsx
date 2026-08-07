import { cn } from "@/lib/utils";

function Logo({ className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "font-mono text-[0.5rem] leading-[1.1] text-primary select-none",
        className,
      )}
      {...props}
    >
      {String.raw`
█████   ████                   ████
░░███   ███░                   ░░███
 ░███  ███     ██████   ██████  ░███
 ░███████     ███░░███ ███░░███ ░███
 ░███░░███   ░███████ ░███████  ░███
 ░███ ░░███  ░███░░░  ░███░░░   ░███
 █████ ░░████░░██████ ░░██████  █████
░░░░░   ░░░░  ░░░░░░   ░░░░░░  ░░░░░ `}
    </pre>
  );
}

export { Logo };
