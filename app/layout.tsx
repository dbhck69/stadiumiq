import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Nav from "@/components/Nav";
import TourProvider from "@/components/Tour";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StadiumIQ — AI Copilot for FIFA World Cup 2026 Stadiums",
  description:
    "GenAI-powered smart stadium platform: multilingual fan companion, agentic operations command center, and a what-if digital twin for FIFA World Cup 2026.",
  keywords: ["FIFA World Cup 2026", "smart stadium", "GenAI", "Gemini", "crowd management", "digital twin", "multilingual", "accessibility"],
  openGraph: {
    title: "StadiumIQ — One stadium. 82,500 fans. Zero chaos.",
    description:
      "A multilingual AI companion for every fan and an agentic command center for the people keeping them safe.",
    type: "website",
    siteName: "StadiumIQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#05080f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col floodlights">
        <TourProvider>
          <Nav />
          {children}
        </TourProvider>
      </body>
    </html>
  );
}
