import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SurVial Academia",
  description:
    "Campus y landing institucional de SurVial Academia para capacitación de conductores profesionales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR">
      <body className={`${manrope.variable} ${sora.variable}`}>{children}</body>
    </html>
  );
}
