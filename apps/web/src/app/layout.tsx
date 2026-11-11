import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import DisclaimerBanner from "../components/DisclaimerBanner";

export const metadata: Metadata = {
  title: "ASUP — Institutional Acquisition Sourcing & Underwriting Platform",
  description:
    "Deterministic family-office acquisition sourcing and underwriting platform under Mandate ROA-SMB-01 (SBA SOP 50 10 8.1 & Va. Code §§ 55.1-320 to 55.1-322).",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ASUP Sourcing",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500/30 selection:text-white">
        <DisclaimerBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
