import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import WhatsAppFloat from "./components/WhatsAppFloat";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ui/ThemeToggle";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const metaTitle = "SmileTripCare | Medical Tourism & Dental Travel";
const metaDescription =
  "SmileTripCare connects international patients with trusted dental clinics in Colombia—coordinated end-to-end with curated specialists and guided travel care.";

const siteUrl = typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL.trim()
  ? process.env.NEXT_PUBLIC_SITE_URL.trim()
  : undefined;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: metaTitle,
  description: metaDescription,
  openGraph: {
    title: metaTitle,
    description: metaDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSerif.variable} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <div className="relative min-h-screen bg-(--color-background) text-(--color-foreground)">
            {/* Global theme toggle, fixed at the top-right on all pages */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-end px-4 pt-4">
              <div className="pointer-events-auto">
                <ThemeToggle />
              </div>
            </div>
            {children}
            <WhatsAppFloat />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

