import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.echomarkets.xyz";
const TITLE = "EchoMarkets — now your agent can buy the signal";
const DESCRIPTION =
  "Paid prediction-market intelligence for AI agents. Free search and preview, a 2¢ brief or a 10¢ Dawn strategy with 24h signal access, paid via x402 in PayBox.";

// Share images come from app/opengraph-image.png and app/twitter-image.png (Next file convention).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL), // makes the image URLs absolute, as social crawlers require
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: "/logo.svg" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "EchoMarkets",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@echo_markets",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
