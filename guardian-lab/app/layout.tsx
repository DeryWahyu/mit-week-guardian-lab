import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guardian Lab | Anti-Phishing Sandbox & APK X-Ray Analysis",
  description:
    "Platform Sandbox Anti-Phishing & Bedah APK yang mengintegrasikan tiga pilar: Recognize, Protect, dan Act.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster
          position="bottom-right"
          theme="light"
          className="guardian-toaster"
          offset={20}
          mobileOffset={16}
          closeButton
          containerAriaLabel="Notifikasi"
          toastOptions={{ closeButtonAriaLabel: "Tutup notifikasi" }}
        />
      </body>
    </html>
  );
}
