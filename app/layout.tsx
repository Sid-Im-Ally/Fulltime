import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { PRODUCT_NAME } from "@/lib/brand";

const DESCRIPTION =
  "Checks a youth-soccer evaluation spreadsheet for consistency, data integrity and coverage — entirely in your browser.";

export const metadata: Metadata = {
  // `default` is the bare app name; `template` appends it to child-page titles.
  title: {
    default: PRODUCT_NAME,
    template: `%s — ${PRODUCT_NAME}`,
  },
  applicationName: PRODUCT_NAME,
  description: DESCRIPTION,
  openGraph: {
    title: PRODUCT_NAME,
    siteName: PRODUCT_NAME,
    description: DESCRIPTION,
  },
  twitter: {
    title: PRODUCT_NAME,
    description: DESCRIPTION,
  },
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
