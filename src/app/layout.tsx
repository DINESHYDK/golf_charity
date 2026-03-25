import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

// ─── FONTS ────────────────────────────────────
// Playfair Display for headings — premium, editorial feel
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// DM Sans for body text — clean, modern, readable
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// ─── METADATA ─────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "GolfGive — Play Golf. Win Prizes. Change Lives.",
    template: "%s | GolfGive",
  },
  description:
    "A subscription-based golf platform combining Stableford score tracking, monthly prize draws, and charitable giving. Every swing makes a difference.",
  keywords: [
    "golf",
    "charity",
    "subscription",
    "stableford",
    "prize draw",
    "golf scores",
    "charitable giving",
  ],
};

// ─── ROOT LAYOUT ──────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${dmSans.variable}`}
    >
      <body className="font-body antialiased">
        {/* Toast notifications — positioned top-right */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "var(--font-body)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            },
            success: {
              iconTheme: {
                primary: "var(--color-success)",
                secondary: "white",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--color-error)",
                secondary: "white",
              },
            },
          }}
        />

        {/* Main content */}
        {children}
      </body>
    </html>
  );
}
