import type { Metadata } from 'next';
import productConfig from '@/config/product.config';
import './globals.css';

export const metadata: Metadata = {
  title: productConfig.name,
  description: productConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
