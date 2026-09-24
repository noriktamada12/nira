/**
 * NIRA - design tokens.
 *
 * Warna, radius, tipografi dan durasi animasi diambil dari riset design
 * Telegram asli (telegram.org + web.telegram.org/k) yang sudah diekstrak
 * ke tg-design/DESIGN-REFERENCE.md. Prinsip yang dipertahankan:
 * satu warna aksen, hairline 1px sebagai pemisah, radius kecil untuk UI,
 * transisi 200ms dengan cubic-bezier(0.4, 0, 0.2, 1), hanya opacity+transform.
 */

export const palette = {
  // aksen tunggal: hijau NIRA (#1B7A3E - kontras 4.68:1 dgn putih, lolos AA)
  accent: '#1B7A3E',
  accentHover: '#155F31',
  accentSoft: 'rgba(27,133,68,0.10)',
  accentBright: '#3AAC69',

  // "bubble out" hijau muda - dipakai untuk aksi sukses
  green: '#2E9E5B',
  greenSoft: 'rgba(46,158,91,0.12)',

  danger: '#df3f40',
  dangerSoft: 'rgba(223,63,64,0.12)',

  warning: '#f2a33c',
  warningSoft: 'rgba(242,163,60,0.14)',

  // netral terang (telegram.org)
  bg: '#f4f4f5',
  surface: '#ffffff',
  surfaceAlt: '#fafafa',
  border: '#dfe1e5',
  hairline: 'rgba(0,0,0,0.08)',
  text: '#000000',
  textMuted: '#707579',
  textDim: '#8c8e91',
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const dark = {
  bg: '#17212b',
  surface: '#232e3c',
  surfaceAlt: '#1e2733',
  border: 'rgba(255,255,255,0.08)',
  text: '#e9edf1',
  textMuted: '#93a1af',
  accent: '#3AAC69',
  green: '#4CC477',
} as const;

export const radius = {
  xs: 4,      // dominan Telegram
  sm: 8,
  md: 10,     // kartu
  lg: 16,
  xl: 19,     // pill
  chat: 24,   // input chat
  bubble: 15,
  bubbleTail: 5,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  gutter: 15, // gutter telegram.org
} as const;

export const type = {
  // Telegram: 14px paling dominan, teks kecil & rapat
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11.5, fontWeight: '500' as const },
  button: { fontSize: 15, fontWeight: '600' as const },
} as const;

/** 200ms adalah durasi paling dominan di CSS Telegram (119 kemunculan). */
export const motion = {
  fast: 100,
  base: 200,
  enter: 300,
  exit: 250,
  /** cubic-bezier(0.4, 0, 0.2, 1) - kurva standar Telegram */
  easing: [0.4, 0, 0.2, 1] as const,
  /** cubic-bezier(0.16, 1, 0.3, 1) - kurva exit ekspresif */
  easingOut: [0.16, 1, 0.3, 1] as const,
} as const;

/** Bayangan hemat - Telegram lebih pakai hairline daripada shadow. */
export const shadow = {
  hair: {
    shadowColor: '#143c53',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;
