import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaStatus from "@/components/PwaStatus";

export const metadata: Metadata = {
  title: "POP THE BALLOON CHALLENGE",
  description:
    "Interactive balloon safety challenge for live events — pop a balloon, answer the question.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/media/images/renaissance-logo.png",
    apple: "/media/images/renaissance-logo.png",
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
