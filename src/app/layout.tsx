import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "StudesQ - Your Growth, Your Terms",
    template: "%s | StudesQ",
  },
  description:
    "The all-in-one student growth platform — study timer, smart flashcards, habit tracking, analytics, and more.",
  openGraph: {
    title: "StudesQ - Your Growth, Your Terms",
    description:
      "The all-in-one student growth platform — study timer, smart flashcards, habit tracking, analytics, and more.",
    type: "website",
    siteName: "StudesQ",
  },
  twitter: {
    card: "summary",
    title: "StudesQ - Your Growth, Your Terms",
    description:
      "The all-in-one student growth platform for academic tracking and personal development.",
  },
  icons: {
    icon: "/icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
