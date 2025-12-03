import type { Metadata } from "next";  
import { Geist, Geist_Mono } from "next/font/google";  
import "./globals.css";  
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";  
  
const geistSans = Geist({  
  variable: "--font-geist-sans",  
  subsets: ["latin"],  
});  
  
const geistMono = Geist_Mono({  
  variable: "--font-geist-mono",  
  subsets: ["latin"],  
});  
  
export const metadata: Metadata = {  
  title: "Dirty Roots Console",  
  description: "Place management and question answer console",  
  manifest: "/manifest.json",  
  themeColor: "#0B0B0B",  
  appleWebApp: {  
    capable: true,  
    statusBarStyle: "black-translucent",  
    title: "Dirty Roots",  
  },  
  icons: {  
    icon: [  
      { url: "/icons/android/android-launchericon-192-192.png", sizes: "192x192" },  
      { url: "/icons/android/android-launchericon-512-512.png", sizes: "512x512" },  
    ],  
    apple: [  
      { url: "/icons/ios/180.png", sizes: "180x180" },  
    ],  
  },  
};  
  
export default function RootLayout({  
  children,  
}: Readonly<{  
  children: React.ReactNode;  
}>) {  
  return (  
    <html lang="es">  
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>  
        <ServiceWorkerRegister />  
        {children}  
      </body>  
    </html>  
  );  
}