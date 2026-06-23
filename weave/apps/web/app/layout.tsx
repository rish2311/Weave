import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weave – Visual Application IDE",
  description:
    "AI-native Visual Application IDE that generates production-grade React/Next.js applications with full code ownership.",
  keywords: ["visual IDE", "web builder", "React generator", "no-code", "AI builder"],
  openGraph: {
    title: "Weave – Visual Application IDE",
    description: "Design. Build. Ship.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
