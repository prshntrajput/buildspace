import type { Metadata } from "next";
import { Oxanium, Source_Code_Pro } from "next/font/google";
import "./globals.css";

const fontSans = Oxanium({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildSpace — Build in Public. Ship with Proof.",
  description:
    "An execution-first platform for builders to take ideas to shipped products in public. Verifiable Execution Score. AI-powered accountability.",
  keywords: ["startup", "builder", "ideas", "execution", "products", "open startup"],
  openGraph: {
    title: "BuildSpace",
    description: "Build in public. Ship with proof.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
