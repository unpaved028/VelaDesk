import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalSidebar } from "../components/layout/GlobalSidebar";
import { ThemeProvider } from "../components/theme-provider";
import { Omnibox } from "../components/ui/Omnibox";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VelaDesk - CSM/ITSM",
  description: "Lightweight multi-tenant CSM/ITSM system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden`} suppressHydrationWarning>
      <body className="h-screen flex overflow-hidden bg-surface dark:bg-[#0b0f10] text-on-background dark:text-white antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Omnibox />
        </ThemeProvider>
      </body>
    </html>
  );
}
