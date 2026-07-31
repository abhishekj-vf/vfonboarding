import type { Metadata } from "next";
import { DM_Serif_Display, Nunito } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const siteUrl = `${protocol}://${host}`;
  const title = "ViralFission | Your point of view has a pulse";
  const description =
    "A creator invitation for the people shaping what everyone talks about next.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: `${siteUrl}/og-creator-signal.png`,
          width: 1664,
          height: 928,
          alt: "Your point of view has a pulse — ViralFission",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/og-creator-signal.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${dmSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
