import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { RoleProvider } from "@/components/RoleProviderWrapper";

export const metadata: Metadata = {
  title: "Service Request System",
  description: "Internal service request portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          <AppHeader />
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}

