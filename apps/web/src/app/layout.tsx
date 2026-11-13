import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import DisclaimerBanner from "../components/DisclaimerBanner";
import SettingsModal from "../components/SettingsModal";
import { AuthProvider } from "../context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext";

export const metadata: Metadata = {
  title: "Argus — Autonomous Asset Intelligence & Underwriting Platform",
  description:
    "Argus: Deterministic family-office acquisition sourcing, spatial intelligence, and air-gapped underwriting platform (SBA SOP 50 10 8.1 & Va. Code §§ 55.1-320 to 55.1-322).",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Argus Intelligence",
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
        <AuthProvider>
          <SettingsProvider>
            <DisclaimerBanner />
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-8">
              {children}
            </main>
            <SettingsModal />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
