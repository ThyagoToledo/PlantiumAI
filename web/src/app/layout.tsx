import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlantiumAI",
  description:
    "Plataforma de monitoramento para micro estufas, plantações verticais e containers com sensores IoT e IA.",
};

// Responsividade: viewport correto para mobile-first.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#22c55e",
};

// Aplica o tema escuro como padrão permanente.
const themeScript = `
(function(){try{
  document.documentElement.setAttribute('data-theme', 'dark');
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
