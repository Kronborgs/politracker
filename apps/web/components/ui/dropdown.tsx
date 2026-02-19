"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownRoot = Dropdown.Root;
export const DropdownTrigger = Dropdown.Trigger;

export function DropdownContent({ className, ...props }: Dropdown.DropdownMenuContentProps) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content className={cn("z-50 min-w-40 rounded-xl border border-border bg-card p-1", className)} {...props} />
    </Dropdown.Portal>
  );
}

export function DropdownItem({ className, ...props }: Dropdown.DropdownMenuItemProps) {
  return <Dropdown.Item className={cn("rounded-md px-2 py-1.5 text-sm outline-none hover:bg-muted", className)} {...props} />;
}
