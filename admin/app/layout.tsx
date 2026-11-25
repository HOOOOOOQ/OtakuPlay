import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OtakuPlay Admin — Command Center',
  description: 'Your Anime. Your Community. Your Universe. — Dashboard Administrasi OtakuPlay',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-background text-text-primary antialiased">{children}</body>
    </html>
  );
}
