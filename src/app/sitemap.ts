import type { MetadataRoute } from 'next';

const locales = ['en', 'es', 'pt'];
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://herramientas-zigq.vercel.app';

const tools = [
  { slug: 'ip-lookup', en: 'what-is-my-ip', es: 'cual-es-mi-ip', pt: 'qual-e-o-meu-ip' },
  { slug: 'password-generator', en: 'password-generator', es: 'generador-de-contrasenas', pt: 'gerador-de-senhas' },
  { slug: 'word-counter', en: 'word-counter', es: 'contador-de-palabras', pt: 'contador-de-palavras' },
  { slug: 'qr-generator', en: 'qr-code-generator', es: 'generador-de-qr', pt: 'gerador-de-qr' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    pages.push({ url: `${baseUrl}/${locale}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 });
    for (const tool of tools) {
      pages.push({ url: `${baseUrl}/${locale}/${tool.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 });
    }
  }
  return pages;
}
