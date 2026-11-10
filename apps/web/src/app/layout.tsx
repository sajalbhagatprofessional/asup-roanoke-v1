import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import DisclaimerBanner from "../components/DisclaimerBanner";

export const metadata: Metadata = {
  title: "ASUP Roanoke — Acquisition Sourcing & Underwriting Platform",
  description:
    "Deterministic family-office acquisition sourcing and underwriting platform under Mandate ROA-SMB-01 (SBA SOP 50 10 8.1 & Va. Code §§ 55.1-320 to 55.1-322).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <DisclaimerBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
