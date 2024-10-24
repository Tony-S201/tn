import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";
import Footer from "./components/footer";
import Navigation from "./components/navigation";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TokenNest App",
  description: "App description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RainbowKitAndWagmiProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </RainbowKitAndWagmiProvider>
      </body>
    </html>
  );
}
