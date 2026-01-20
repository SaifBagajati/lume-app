import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lume - QR Code Ordering for Canadian Restaurants",
  description:
    "Transform your restaurant with QR code ordering. Guests scan, order, and pay from their phones. Reduce wait times, turn tables faster, and let your staff focus on hospitality.",
  keywords: [
    "QR ordering",
    "restaurant technology",
    "Canadian restaurants",
    "contactless ordering",
    "table ordering",
    "restaurant POS",
  ],
  openGraph: {
    title: "Lume - QR Code Ordering for Canadian Restaurants",
    description:
      "Transform your restaurant with QR code ordering. Guests scan, order, and pay from their phones.",
    type: "website",
    locale: "en_CA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-navy-500">
        {children}
      </body>
    </html>
  );
}
