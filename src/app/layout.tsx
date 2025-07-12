
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using next/font for Inter
import './globals.css';
import { AppProviders } from '@/components/AppProviders';
import { SiteHeader } from '@/components/SiteHeader';
import { AuthGuard } from '@/components/AuthGuard';

// Force dynamic rendering to ensure server-side environment variables are available at runtime.
// This is crucial for deployment environments where build-time variables are not available.
export const dynamic = 'force-dynamic';

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS variable for Inter
});

export const metadata: Metadata = {
  title: 'Portal Porto Vale',
  description: 'Portal de serviços da Porto Vale Consórcio e Seguros',
  icons: {
    icon: '/logo.png',
  },
  robots: {
    index: false,
    follow: false,
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
        {/*
          This script safely passes runtime environment variables from the server to the client.
          It's necessary for services like Cloud Run where client-side env vars aren't available at build time.
          The 'dynamic' export ensures this layout is server-rendered at request time, making process.env available.
          JSON.stringify with a null fallback prevents syntax errors if a variable is missing.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.NEXT_PUBLIC_SUPABASE_URL = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || null)};
              window.NEXT_PUBLIC_SUPABASE_ANON_KEY = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null)};
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col">
        <AppProviders>
          <SiteHeader />
          <main className="flex-grow container mx-auto py-6 sm:py-8 px-4 sm:px-6 md:px-8">
            <AuthGuard>{children}</AuthGuard>
          </main>
          <footer className="text-center p-6 text-xs text-muted-foreground border-t mt-auto">
            <p>Marketing Power - Porto Vale</p>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
