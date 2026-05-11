import './globals.css';

export const metadata = { title: 'Factory cockpit', description: 'Pilotage multi-sites' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans bg-white text-gray-900">
        <header className="border-b px-6 py-3 flex items-center gap-4 text-sm">
          <strong>Factory</strong>
          <a href="/" className="hover:underline">Home</a>
          <a href="/sites" className="hover:underline">Sites</a>
          <a href="/pnl" className="hover:underline">P&amp;L</a>
          <a href="/incidents" className="hover:underline">Incidents</a>
          <a href="/decisions" className="hover:underline">Decisions</a>
          <a href="/data-products" className="hover:underline">Data</a>
          <a href="/security" className="hover:underline">Security</a>
        </header>
        {children}
      </body>
    </html>
  );
}
