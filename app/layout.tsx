import React from 'react';
import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import Providers from "./providers";
import "../src/index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WAHS CRM | Premium Sales & Sourcing Operations",
  description: "Enterprise CRM and Sales Operations portal for WAHS Technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
