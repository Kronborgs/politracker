"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const DialogRoot = Dialog.Root;
export const DialogTrigger = Dialog.Trigger;

export function DialogContent({ className, ...props }: Dialog.DialogContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Dialog.Content className={cn("fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl glass p-6", className)} {...props} />
    </Dialog.Portal>
  );
}
