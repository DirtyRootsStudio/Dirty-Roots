import type { Metadata } from "next";  
import { Geist, Geist_Mono } from "next/font/google";  
import "./globals.css";  
  
const geistSans = Geist({  
  variable: "--font-geist-sans",  
  subsets: ["latin"],  
});  
  
const geistMono = Geist_Mono({  
  variable: "--font-geist-mono",  
  subsets: ["latin"],  
});  
  
export const metadata: Metadata = {  
  title: "Dirty Roots - Lugares Calmados",  
  description: "Descubre y comparte lugares tranquilos. Comunidad de espacios calmados y preguntas sobre bienestar.",  
  manifest: "/manifest.json",  
  themeColor: "#0B0B0B",  
  appleWebApp: {  
    capable: true,  
    statusBarStyle: "black-translucent",  
    title: "Dirty Roots",  
  },  
};  
  
export default function RootLayout({  
  children,  
}: Readonly<{  
  children: React.ReactNode;  
}>) {  
  return (  
    <html lang="es">  
      <head>  
        <link rel="manifest" href="/manifest.json" />  
        <meta name="theme-color" content="#0B0B0B" />  
        <meta name="apple-mobile-web-app-capable" content="yes" />  
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />  
      </head>  
      <body  
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}  
      >  
        {children}  
      </body>  
    </html>  
  );  
}