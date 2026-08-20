import type { Metadata } from "next";
import { Azeret_Mono, Fraunces, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Newsreader({
  variable: "--font-body",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const mono = Azeret_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "AVLIX — AVL rotation puzzle",
  description:
    "A Rubik’s cube for binary trees. Rotate a scrambled BST until every node satisfies the AVL balance invariant.",
  openGraph: {
    title: "AVLIX — AVL rotation puzzle",
    description:
      "A Rubik’s cube for binary trees. Rotate until every node is AVL-balanced.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVLIX — AVL rotation puzzle",
    description:
      "A Rubik’s cube for binary trees. Rotate until every node is AVL-balanced.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
