'use client';
import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { isValidLocale, getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { Copy, Check, Upload, Plus, Shuffle, Palette, Pipette } from 'lucide-react';

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round((s || 0) * 100), l: Math.round(l * 100) };
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30 transition-colors">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {label}
    </button>
  );
}

export default function ColorToolsPage() {
  const params = useParams();
  const locale = params.locale as string;
  if (!isValidLocale(locale)) return null;
  const dict = getDictionary(locale as Locale);

  // Color Picker state
  const [color, setColor] = useState('#6366f1');
  const rgb = hexToRgb(color);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  // Palette extraction state
  const [imageColors, setImageColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const extractColors = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorMap = new Map<string, number>();
      const step = Math.max(1, Math.floor(imageData.length / 20000));
      for (let i = 0; i < imageData.length; i += step * 4) {
        const r = Math.round(imageData[i] / 32) * 32;
        const g = Math.round(imageData[i + 1] / 32) * 32;
        const b = Math.round(imageData[i + 2] / 32) * 32;
        const key = rgbToHex(r, g, b);
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }
      const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      setImageColors(sorted.map(([c]) => c));
    };
    img.src = URL.createObjectURL(file);
  }, []);

  // Gradient state
  const [gradientColors, setGradientColors] = useState(['#6366f1', '#ec4899']);
  const [gradientDir, setGradientDir] = useState('to right');
  const dirs = ['to right', 'to left', 'to bottom', 'to top', 'to bottom right', 'to bottom left', 'to top right', 'to top left'];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl tool-icon shadow-lg">
          <Palette className="h-7 w-7 text-white" />
        </div>
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{dict.siteTitle}</h1>
        <p className="text-muted-foreground">{dict.siteTagline}</p>
      </div>

      {/* Color Picker */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Pipette className="h-5 w-5 text-primary" /> {dict.colorPicker}
        </h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="h-40 w-full cursor-pointer rounded-xl border-0 sm:h-48 sm:w-48" style={{ background: color, WebkitAppearance: 'none' }} />
          <div className="flex-1 space-y-3">
            {[
              { label: dict.hex, value: color },
              { label: 'RGB', value: rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '' },
              { label: 'HSL', value: hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                <span className="w-10 text-sm font-medium text-muted-foreground">{label}</span>
                <code className="flex-1 font-mono text-foreground">{value}</code>
                <CopyButton text={value} label={dict.copy} />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'].map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 border-white/20 transition-transform hover:scale-110 shadow-sm"
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Palette from Image */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Palette className="h-5 w-5 text-primary" /> {dict.paletteExtractor}
        </h2>
        <div className="flex flex-col items-center gap-4">
          <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) extractColors(file); }}
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center transition-colors hover:border-primary/50 hover:bg-secondary/50">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{dict.dropImage}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) extractColors(file); }} className="hidden" />
          {imageColors.length > 0 && (
            <div className="w-full space-y-2">
              <p className="text-sm text-muted-foreground">{imageColors.length} {dict.colorsFound}</p>
              <div className="flex flex-wrap gap-2">
                {imageColors.map((c, i) => (
                  <button key={i} onClick={() => setColor(c)}
                    className="group relative h-16 w-16 overflow-hidden rounded-xl transition-transform hover:scale-110"
                    style={{ background: c }}>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">{c}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setImageColors([])} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
            </div>
          )}
        </div>
      </section>

      {/* Gradient Generator */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <span className="text-lg">🎨</span> {dict.gradientGen}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {gradientColors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                <input type="color" value={c} onChange={e => { const nc = [...gradientColors]; nc[i] = e.target.value; setGradientColors(nc); }}
                  className="h-8 w-8 cursor-pointer rounded border-0" />
                <code className="text-sm font-mono">{c}</code>
                {gradientColors.length > 2 && (
                  <button onClick={() => setGradientColors(gradientColors.filter((_, j) => j !== i))}
                    className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                )}
              </div>
            ))}
            {gradientColors.length < 6 && (
              <button onClick={() => setGradientColors([...gradientColors, '#6366f1'])}
                className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" /> {dict.addColor}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{dict.direction}:</span>
            <select value={gradientDir} onChange={e => setGradientDir(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
              {dirs.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={() => setGradientColors(gradientColors.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')))}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20">
              <Shuffle className="h-4 w-4" /> {dict.randomPalette}
            </button>
          </div>
          <div className="relative h-32 w-full overflow-hidden rounded-xl" style={{ background: `linear-gradient(${gradientDir}, ${gradientColors.join(', ')})` }}>
            <button onClick={() => navigator.clipboard.writeText(`background: linear-gradient(${gradientDir}, ${gradientColors.join(', ')});`)}
              className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/60">
              <Copy className="h-3 w-3" /> CSS
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
