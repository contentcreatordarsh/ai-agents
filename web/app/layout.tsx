import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StrikeMap — Your city. Your battlefield.",
  description:
    "Real-world multiplayer City Battle on strikemap.space — Cloudflare Workers, Durable Objects, and tactical maps.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
