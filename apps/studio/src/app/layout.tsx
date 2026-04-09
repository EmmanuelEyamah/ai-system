import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StudioProvider } from "@/providers/StudioProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manny AI Studio",
  description: "AI-powered prompt engineering and research platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body suppressHydrationWarning className="h-full bg-[#050507] text-zinc-100 font-sans overflow-hidden">
        <StudioProvider>
          {children}
        </StudioProvider>
      </body>
    </html>
  );
}
