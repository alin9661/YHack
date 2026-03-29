import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PolyLava — Prediction Market Intelligence",
  description: "AI-powered prediction market analysis with Polymarket data and custom signals",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='none' stroke='%23D4A84B' stroke-width='2'/><ellipse cx='50' cy='50' rx='15' ry='8' fill='none' stroke='%23D4A84B' stroke-width='2'/><circle cx='50' cy='50' r='3' fill='%23D4A84B'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${jetbrains.variable} dark h-full antialiased`}
    >
      <body className="grain-overlay min-h-full flex flex-col bg-oracle-void text-oracle-text">
        {children}
      </body>
    </html>
  );
}
