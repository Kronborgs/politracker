import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border bg-card/80 px-3 py-2 text-sm outline-none transition focus:border-accent",
        className
      )}
      {...props}
    />
  );
}
