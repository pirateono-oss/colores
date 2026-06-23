'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Locale, TranslationDict } from '@/lib/types';
import { locales, localeNames } from '@/lib/i18n';
import { Globe, Menu, X } from 'lucide-react';

interface HeaderProps { locale: Locale; dict: TranslationDict; }

export function Header({ locale, dict }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-lg font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg tool-icon text-sm">🔧</div>
          <span>{dict.siteTitle}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Globe className="h-4 w-4" /><span className="hidden sm:inline">{localeNames[locale]}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
                {locales.map((loc) => (
                  <Link key={loc} href={`/${loc}`} onClick={() => setLangOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary ${loc === locale ? 'bg-primary/10 font-medium text-primary' : 'text-foreground'}`}>
                    {localeNames[loc]}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
