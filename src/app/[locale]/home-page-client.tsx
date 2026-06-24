'use client';
import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { isValidLocale, getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { Copy, Check, Upload, Plus, Shuffle, Palette, Pipette, Eye, Layers } from 'lucide-react';

// --- Color Utilities ---
function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) { case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break; case g: h = ((b - r) / d + 2) * 60; break; case b: h = ((r - g) / d + 4) * 60; break; }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function luminance(hex: string) {
  const c = hexToRgb(hex); if (!c) return 0;
  const [r, g, b] = [c.r, c.g, c.b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string) {
  const l1 = luminance(hex1), l2 = luminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function rotateHue(hex: string, deg: number) {
  const rgb = hexToRgb(hex); if (!rgb) return '#6366f1';
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return rgbToHex(hslToRgb((hsl.h + deg + 360) % 360, hsl.s, hsl.l).r, hslToRgb((hsl.h + deg + 360) % 360, hsl.s, hsl.l).g, hslToRgb((hsl.h + deg + 360) % 360, hsl.s, hsl.l).b);
}

function adjustLightness(hex: string, amount: number) {
  const rgb = hexToRgb(hex); if (!rgb) return '#6366f1';
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const l = Math.max(0, Math.min(100, hsl.l + amount));
  return rgbToHex(hslToRgb(hsl.h, hsl.s, l).r, hslToRgb(hsl.h, hsl.s, l).g, hslToRgb(hsl.h, hsl.s, l).b);
}

function hexToRgbStr(hex: string) {
  const c = hexToRgb(hex); return c ? `rgb(${c.r}, ${c.g}, ${c.b})` : '';
}

// Apple System Colors
const appleSystemColors = [
  { name: 'Red', hex: '#FF3B30' }, { name: 'Orange', hex: '#FF9500' }, { name: 'Yellow', hex: '#FFCC00' },
  { name: 'Green', hex: '#34C759' }, { name: 'Mint', hex: '#00C7BE' }, { name: 'Teal', hex: '#30B0C7' },
  { name: 'Cyan', hex: '#32ADE6' }, { name: 'Blue', hex: '#007AFF' }, { name: 'Indigo', hex: '#5856D6' },
  { name: 'Purple', hex: '#AF52DE' }, { name: 'Pink', hex: '#FF2D55' }, { name: 'Brown', hex: '#A2845E' },
  { name: 'Gray', hex: '#8E8E93' }, { name: 'Gray2', hex: '#AEAEB2' }, { name: 'Gray3', hex: '#C7C7CC' },
  { name: 'Gray4', hex: '#D1D1D6' }, { name: 'Gray5', hex: '#E5E5EA' }, { name: 'Gray6', hex: '#F2F2F7' },
];

// Material Design palette - tonal palette from a primary color
function generateMaterialPalette(primary: string): { label: string; hex: string; contrast: string }[] {
  const luminosity = luminance(primary);
  const isDark = luminosity < 0.3;
  const rgb = hexToRgb(primary); if (!rgb) return [];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const shades = [95, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5];
  return shades.map(s => {
    const hex = rgbToHex(hslToRgb(hsl.h, Math.min(100, hsl.s * (s / 50)), s).r, hslToRgb(hsl.h, Math.min(100, hsl.s * (s / 50)), s).g, hslToRgb(hsl.h, Math.min(100, hsl.s * (s / 50)), s).b);
    const textColor = s > 50 ? '#000000' : '#FFFFFF';
    return { label: `${s * 10}`, hex, contrast: textColor };
  });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors hover:bg-white/30"
      style={{ color: '#fff', backgroundColor: copied ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)' }}>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {label}
    </button>
  );
}

type ColorSwatchProps = { hex: string; name: string; size?: string; showTooltip?: boolean };
function ColorSwatch({ hex, name, size = 'h-20' }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);
  const textColor = luminance(hex) < 0.4 ? '#fff' : '#000';
  return (
    <div className={`relative flex flex-col items-center justify-end rounded-xl p-2 ${size} cursor-pointer transition-transform hover:scale-105`}
      style={{ backgroundColor: hex }} onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      <span className="text-[10px] font-medium" style={{ color: textColor, opacity: 0.9 }}>{name}</span>
      <span className="text-[10px] font-mono" style={{ color: textColor, opacity: 0.7 }}>{hex}</span>
      {copied && <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 text-xs text-white">Copied!</span>}
    </div>
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

  // Harmony state
  const [harmonyColor, setHarmonyColor] = useState('#6366f1');
  const [harmonyType, setHarmonyType] = useState<'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split'>('complementary');

  const getHarmonyColors = (): { hex: string; name: string }[] => {
    const degs: Record<string, number[]> = {
      complementary: [0, 180],
      analogous: [0, 30, 60],
      triadic: [0, 120, 240],
      tetradic: [0, 90, 180, 270],
      split: [0, 150, 210],
    };
    return (degs[harmonyType] || [0, 180]).map((d, i) => ({
      hex: rotateHue(harmonyColor, d),
      name: i === 0 ? dict.primary : `${dict.secondary} ${i}`,
    }));
  };

  // Material palette
  const [materialPrimary, setMaterialPrimary] = useState('#6366f1');
  const materialPalette = generateMaterialPalette(materialPrimary);

  // Accessibility
  const [accessColor1, setAccessColor1] = useState('#6366f1');
  const [accessColor2, setAccessColor2] = useState('#FFFFFF');
  const ratio = contrastRatio(accessColor1, accessColor2);
  const wcagAA = { normal: ratio >= 4.5, large: ratio >= 3 };
  const wcagAAA = { normal: ratio >= 7, large: ratio >= 4.5 };

  // Image palette extraction
  const [imageColors, setImageColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractColors = useCallback((file: File) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const map = new Map<string, number>();
      const step = Math.max(1, Math.floor(data.length / 20000));
      for (let i = 0; i < data.length; i += step * 4) {
        const k = rgbToHex(Math.round(data[i] / 32) * 32, Math.round(data[i + 1] / 32) * 32, Math.round(data[i + 2] / 32) * 32);
        map.set(k, (map.get(k) || 0) + 1);
      }
      setImageColors([...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c));
    };
    img.src = URL.createObjectURL(file);
  }, []);

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

      {/* Color Picker — unchanged */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Pipette className="h-5 w-5 text-primary" /> {dict.colorPicker}</h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="color-picker-input h-40 w-full cursor-pointer rounded-xl border-0 sm:h-48 sm:w-48" />
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
              {['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#a855f7','#ec4899'].map(c => (
                <button key={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full border-2 border-white/20 shadow-sm transition-transform hover:scale-110" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Color Harmony — Apple/Google inspired */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Eye className="h-5 w-5 text-primary" /> {dict.colorSchemes}</h2>
        
        <div className="mb-5 flex flex-wrap gap-2">
          {([['complementary', dict.complementary], ['analogous', dict.analogous], ['triadic', dict.triadic], ['tetradic', dict.tetradic], ['split', dict.splitComplementary]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setHarmonyType(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${harmonyType === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-3">
          <input type="color" value={harmonyColor} onChange={e => setHarmonyColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-lg border-0" />
          <span className="font-mono text-sm">{harmonyColor}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {getHarmonyColors().map((c, i) => (
            <ColorSwatch key={i} hex={c.hex} name={c.name} size="h-24 w-28" />
          ))}
        </div>
      </section>

      {/* Material Design Palette — Google Material 3 */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Layers className="h-5 w-5 text-primary" /> {dict.materialPalette}</h2>
        <p className="mb-4 text-sm text-muted-foreground">Material Design 3 palette from any primary color. Automatic light/dark text.</p>
        
        <div className="mb-4 flex items-center gap-3">
          <input type="color" value={materialPrimary} onChange={e => setMaterialPrimary(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-lg border-0" />
          <span className="font-mono text-sm">{materialPrimary}</span>
          <button onClick={() => { const h = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'); setMaterialPrimary(h); }}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"><Shuffle className="h-4 w-4" /> Random</button>
        </div>

        <div className="flex flex-wrap gap-1">
          {materialPalette.map((c, i) => (
            <div key={i} className="flex h-16 w-12 flex-col items-center justify-center rounded-lg sm:w-16"
              style={{ backgroundColor: c.hex }}>
              <span className="text-[9px] font-semibold" style={{ color: c.contrast }}>{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Apple System Colors */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <span className="text-lg">🍎</span> {dict.appleColors}
        </h2>
        <div className="flex flex-wrap gap-2">
          {appleSystemColors.map((c, i) => (
            <ColorSwatch key={i} hex={c.hex} name={c.name} size="h-20 w-[88px]" />
          ))}
        </div>
      </section>

      {/* Accessibility Checker */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <span className="text-lg">♿</span> {dict.accessibility}
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Background</label>
            <input type="color" value={accessColor1} onChange={e => setAccessColor1(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded-lg border-0" />
            <p className="mt-1 font-mono text-xs">{accessColor1}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Text</label>
            <input type="color" value={accessColor2} onChange={e => setAccessColor2(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded-lg border-0" />
            <p className="mt-1 font-mono text-xs">{accessColor2}</p>
          </div>
          <button onClick={() => { const t = accessColor1; setAccessColor1(accessColor2); setAccessColor2(t); }}
            className="rounded-lg bg-secondary px-3 py-2 text-sm hover:bg-secondary/80">Swap</button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-2xl font-bold">{ratio.toFixed(1)}:1</p>
            <p className="text-xs text-muted-foreground">{dict.contrastRatio}</p>
          </div>
          {[{ label: dict.normalText, level: 'AA', pass: wcagAA.normal }, { label: dict.largeText, level: 'AA', pass: wcagAA.large },
            { label: dict.normalText, level: 'AAA', pass: wcagAAA.normal }, { label: dict.largeText, level: 'AAA', pass: wcagAAA.large }].map((item, i) => (
            <div key={i} className={`rounded-lg p-3 text-center ${item.pass ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-lg font-bold ${item.pass ? 'text-green-600' : 'text-red-600'}`}>{item.pass ? '✓' : '✗'}</p>
              <p className="text-xs text-muted-foreground">WCAG {item.level}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl" style={{ backgroundColor: accessColor1 }}>
          <div className="p-6 text-center">
            <p className="text-xl font-semibold" style={{ color: accessColor2 }}>
              {dict.textOnColor}
            </p>
            <p className="mt-2 text-sm" style={{ color: accessColor2, opacity: 0.8 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
            </p>
          </div>
        </div>
      </section>

      {/* Palette from Image — simplified */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Palette className="h-5 w-5 text-primary" /> {dict.paletteExtractor}</h2>
        <div className="flex flex-col items-center gap-4">
          <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) extractColors(f); }}
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center transition-colors hover:border-primary/50 hover:bg-secondary/50">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{dict.dropImage}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) extractColors(f); }} className="hidden" />
          {imageColors.length > 0 && (
            <div className="w-full space-y-2">
              <p className="text-sm text-muted-foreground">{imageColors.length} {dict.colorsFound}</p>
              <div className="flex flex-wrap gap-2">
                {imageColors.map((c, i) => (
                  <button key={i} onClick={() => setColor(c)}
                    className="group relative h-16 w-16 overflow-hidden rounded-xl transition-transform hover:scale-110" style={{ background: c }}>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">{c}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setImageColors([])} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
            </div>
          )}
        </div>
      </section>

      {/* Gradient Generator — unchanged */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><span className="text-lg">🎨</span> {dict.gradientGen}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {[color, rotateHue(color, 180)].map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                <input type="color" value={c} onChange={e => { }}
                  className="h-8 w-8 cursor-pointer rounded border-0" />
                <code className="text-sm font-mono">{c}</code>
              </div>
            ))}
          </div>
          <div className="relative h-32 w-full overflow-hidden rounded-xl" style={{ background: `linear-gradient(to right, ${color}, ${rotateHue(color, 180)})` }}>
            <button onClick={() => navigator.clipboard.writeText(`background: linear-gradient(to right, ${color}, ${rotateHue(color, 180)});`)}
              className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/60">
              <Copy className="h-3 w-3" /> CSS
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
