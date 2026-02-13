import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use Inter or something neutral
import "./globals.css";
// Adjust imports as needed once AppProvider is created and exported
import { AppProvider } from "@/components/AppProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FairShare TMA",
  description: "Expense splitting app for Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
