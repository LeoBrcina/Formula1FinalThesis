// src/app/layout.tsx
import './globals.css';
import { Navbar } from '../components/Layout/Navbar';
import { Footer } from '../components/Layout/Footer';

export const metadata = {
  title: 'F1 Data Analytics',
  description: 'Comprehensive F1 data analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-6 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
