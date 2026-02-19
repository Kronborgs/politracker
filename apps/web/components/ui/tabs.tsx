"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const TabsRoot = Tabs.Root;

export function TabsList({ className, ...props }: Tabs.TabsListProps) {
  return <Tabs.List className={cn("inline-flex rounded-xl border border-border bg-muted p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: Tabs.TabsTriggerProps) {
  return (
    <Tabs.Trigger
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm text-foreground/70 data-[state=active]:bg-card data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = Tabs.Content;
