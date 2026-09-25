import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StrikeMap — Live conflict intelligence (demo)",
  description:
    "StrikeMap on strikemap.space — map UI scaffold with edge Workers and AWS EC2 origin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
