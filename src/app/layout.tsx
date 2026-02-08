import type { Metadata } from "next";
import { Chakra_Petch, M_PLUS_1 } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/context/theme-context";

const fontSans = M_PLUS_1({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const fontDisplay = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AkaakuHub",
  description: "自作のアプリをまとめたサイト",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme_v1");
    var mode = "system";
    if (stored === "light" || stored === "dark" || stored === "system") {
      mode = stored;
    }
    var resolved = "light";
    if (mode === "dark" || mode === "light") {
      resolved = mode;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      resolved = "dark";
    }
    var root = document.documentElement;
    if (resolved === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head />
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
