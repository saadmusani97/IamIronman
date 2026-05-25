import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stark Industries — Mark LXXXV",
  description:
    "Arc reactor online. J.A.R.V.I.S. standing by. Scroll to engage the Mark LXXXV.",
  metadataBase: new URL("https://iam-ironman.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Preload first frames so animation starts instantly */}
        <link rel="preload" href="/frames/frame_0001.jpg" as="image" />
        <link rel="preload" href="/frames2/frame_0001.jpg" as="image" />
        {/* Preload audio */}
        <link rel="preload" href="/jarvis-intro.mp3" as="audio" />
        <link rel="preload" href="/mark1-suitup.mp3" as="audio" />
        <link rel="preload" href="/suit-up.mp3" as="audio" />
      </head>
      <body className="relative min-h-full bg-background text-foreground grain">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
