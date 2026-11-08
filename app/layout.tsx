import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaStatus from "@/components/PwaStatus";

export const metadata: Metadata = {
  title: "NAPE 2026 GEOSCIENCE GAMES",
  description:
    "Interactive balloon-popping geoscience games for NAPE 2026 — picture puzzles, missing letters, odd one out and geological features.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/media/images/app-icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <PwaStatus />
      </body>
    </html>
  );
}
