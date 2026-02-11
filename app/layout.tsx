import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lavanderia Premium',
  description: 'Gestão de Lavanderia Offline-First',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} min-h-screen overflow-x-hidden`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
