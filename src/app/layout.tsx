import type { Metadata } from "next";
import { Roboto, Saira_Condensed } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto" });
const saira = Saira_Condensed({
  subsets: ["latin"],
  variable: "--font-saira",
  weight: ["400", "900"],
});

export const metadata: Metadata = {
  title: "EyeEarn · Go where the map needs eyes",
  description:
    "A movement-powered marketplace for privacy-processed place intelligence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${saira.variable}`}>{children}</body>
    </html>
  );
}
