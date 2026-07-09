import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { RoleProvider } from "@/components/RoleProviderWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cora Service Request System",
  description:
    "Internal service request portal — submit, track, and manage finance and IT service requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <RoleProvider>
          <AppHeader />
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
