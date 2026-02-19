import type { Metadata } from "next";
import "./globals.css";
import { AppToaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Politracker",
  description: "Track political statements with transparent evidence"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className="dark">
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
