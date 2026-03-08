import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { branding } from "@/lib/branding";
import "./globals.css";
import WhatsAppFloat from "./components/WhatsAppFloat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${branding.productName} | ${branding.tagline}`,
  description: `Premium coordination for dental transformation and recovery in Medellín and Manizales. A ${branding.companyName} company.`,
  openGraph: {
    title: `${branding.productName} | ${branding.tagline}`,
    description: `Premium coordination for dental transformation and recovery in Medellín and Manizales. A ${branding.companyName} company.`,
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
