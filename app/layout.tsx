import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { PRODUCT_LABEL } from "@/lib/brand";

export const metadata: Metadata = {
  title: PRODUCT_LABEL,
  description:
    "Checks a youth-soccer evaluation spreadsheet for consistency, integrity and coverage — entirely in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Force the light, professional coach skin app-wide. Never toggle to the player skin.
  return (
    <html lang="en" data-skin="coach">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
