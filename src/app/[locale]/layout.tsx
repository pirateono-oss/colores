import Link from 'next/link';
import type { Metadata } from 'next';
import '../globals.css';
import { Header } from '@/components/header';
import { isValidLocale, getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDictionary(locale as Locale);
  const seoDescs: Record<string, { title: string; desc: string }> = {
    en: { title: dict.siteTitle, desc: 'Free online tools: IP address lookup, password generator, word counter, QR code generator. Simple and free tools for everyday use.' },
    es: { title: dict.siteTitle, desc: 'Herramientas online gratuitas: consulta de IP, generador de contraseñas, contador de palabras, generador de QR. Herramientas simples y gratis.' },
    pt: { title: dict.siteTitle, desc: 'Ferramentas online gratuitas: consulta de IP, gerador de senhas, contador de palavras, gerador de QR. Ferramentas simples e grátis.' },
  };
  const seo = seoDescs[locale] || seoDescs.en;
  return { title: seo.title, description: seo.desc, openGraph: { title: seo.title, description: seo.desc } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <>
      <Header locale={locale as Locale} dict={dict} />
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
      <footer className="border-t border-border bg-card py-6 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-2 flex items-center justify-center gap-4">
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">{dict.home}</Link>
          </div>
          <p>&copy; 2025 {dict.siteTitle}. {dict.allRightsReserved}</p>
        </div>
      </footer>
    </>
  );
}
