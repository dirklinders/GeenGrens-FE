'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { href: '/admin/teams', label: 'Teams' },
  { href: '/admin/gebruikers', label: 'Gebruikers' },
  { href: '/admin/characters', label: 'Verdachten' },
  { href: '/admin/locations', label: 'Locatiecodes' },
  { href: '/admin/progress', label: 'Voortgang' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif">Laden...</div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-serif text-lg text-stone-100 tracking-wide">
              Cluedo Admin
            </span>
            <nav className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-red-900 text-red-100'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/" className="text-stone-500 text-sm hover:text-stone-300 transition-colors">
            ← Terug naar spel
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-aut