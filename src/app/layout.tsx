import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://levelupnow.be"),
  title: "LevelUpNow (bêta) — Le réseau des entrepreneurs",
  description:
    "Échangez, développez votre réseau et montez en compétences avec une communauté d'entrepreneurs qualifiée, en Belgique.",
  openGraph: {
    title: "LevelUpNow — Le réseau privé des entrepreneurs",
    description:
      "Communauté qualifiée sur candidature : entraide, networking par province et secteur, formations entre pairs.",
    url: "https://levelupnow.be",
    siteName: "LevelUpNow",
    locale: "fr_BE",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LevelUpNow",
  },
};

export const viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
