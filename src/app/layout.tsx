import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "EyeEarn · Run where the map needs eyes", description: "A movement-powered marketplace for privacy-processed place intelligence." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
