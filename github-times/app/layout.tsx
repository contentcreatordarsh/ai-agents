import type { Metadata } from "next";
import { Libre_Baskerville, Playfair_Display, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "The GitHub Times",
  description:
    "A front-page newspaper dashboard of trending GitHub repositories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${libreBaskerville.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="min-h-full font-body antialiased">{children}</body>
    </html>
  );
}
