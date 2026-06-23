import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Free Tools',
  description: 'Free online tools - IP lookup, password generator, word counter, QR code generator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="google-site-verification" content="N3g3DnG2PKK-vVpA_1Bxd8PkcJILzL2kaqvQq7_yiMU" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9162356987197971"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
