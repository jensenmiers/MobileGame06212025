import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bracket Challenge",
  description: "Predict tournament outcomes and climb the leaderboard!",
  other: [
    { name: "google-site-verification", content: "RlD0Bd3IKA_z8_VYI2sSU9CS-rydQ9BOgC8jnpYynSE" }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
