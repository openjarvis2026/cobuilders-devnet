import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoBuilders - Fork Manager",
  description: "Manage your Anvil fork environments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
