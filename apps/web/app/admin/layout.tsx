import { AppShell } from "@/components/layout/app-shell";
import { AdminGuard } from "@/components/layout/admin-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AppShell admin>{children}</AppShell>
    </AdminGuard>
  );
}
