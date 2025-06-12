
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using next/font for Inter
import './globals.css';
import { AppProviders } from '@/components/AppProviders';
import { SiteHeader } from '@/components/SiteHeader';

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS variable for Inter
});

export const metadata: Metadata = {
  title: 'Tickets - Porto Vale Consórcio',
  description: 'Sistema de abertura de tickets',
  icons: {
    icon: '/favicon.ico', // Assuming you might add a favicon later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Google Fonts <link> tags are not needed when using next/font */}
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col">
        <AppProviders>
          <SiteHeader />
          <main className="flex-grow container mx-auto py-6 sm:py-8 px-4 sm:px-6 md:px-8">
            {children}
          </main>
          <footer className="text-center p-6 text-sm text-muted-foreground border-t mt-auto">
            <p>© Porto Vale Consórcio. Todos os direitos reservados.</p>
            <p className="mt-1">Sistema de atendimento GRE - Suporte comercial</p>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
