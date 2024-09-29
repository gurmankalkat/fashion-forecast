import type { Metadata } from "next";
import { Roboto, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Import the Google Fonts
const roboto = Roboto({
  weight: ["400", "500", "700"], // Specify the weights you want
  subsets: ["latin"], // Define the subset
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"], // Include both normal and italic styles
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.className} ${cormorantGaramond.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
