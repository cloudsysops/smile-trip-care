import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import WhatsAppFloat from "./components/WhatsAppFloat";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const metaTitle = "MedVoyage Smile — Premium Dental Tourism Platform";
const metaDescription =
  "MedVoyage Smile connects international patients with verified dental clinics in Colombia, offering concierge medical tourism and savings up to 70%.";

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
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
