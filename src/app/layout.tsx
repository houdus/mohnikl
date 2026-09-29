import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MovieBox International — Stream Worldwide on Windows",
  description:
    "MovieBox International — the global streaming catalog for Windows 10/11. Trending movies, series, K-dramas, anime and regional hits from 15 countries, updated live.",
  keywords: [
    "MovieBox", "movies", "streaming", "Windows", "Bollywood", "K-drama",
    "anime", "Hollywood", "international", "trending", "TV series",
  ],
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "MovieBox International — Stream Worldwide on Windows",
    description: "Live global catalog: trending films & series from 15 regions, updated every day.",
    siteName: "MovieBox",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieBox International",
    description: "Live global catalog: trending films & series from 15 regions, updated every day.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
};

// Layer 2 of platform enforcement: runs BEFORE first paint so a
// non-Windows visitor never sees even a flash of the app.
const PRE_PAINT_GATE = `
try {
  var u = (navigator.userAgent || '').toLowerCase();
  var mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|silk/i.test(u);
  var win = /windows|win32|win64|win_?nt/.test(u);
  if (!win || mobile) {
    document.documentElement.classList.add('mb-blocked');
    document.documentElement.style.background = '#050507';
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_GATE }} />
      </head>
      <body
        className={`${inter.variable} antialiased bg-[#0A0A0F] font-sans text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
