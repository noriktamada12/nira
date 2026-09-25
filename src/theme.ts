/**
 * NIRA - design tokens (gaya iOS).
 *
 * Dunia visual: iOS Settings / WhatsApp iOS.
 *   - Judul layar 34px rata kiri (large title), bukan header tengah.
 *   - Latar abu sistem (#F2F2F7), kartu putih radius 14.
 *   - Biru iOS (#007AFF) untuk navigasi, hijau NIRA untuk aksi utama.
 *   - Font Inter (metrik mirip SF Pro) + fallback sistem.
 */

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const palette = {
  // aksen utama: hijau NIRA (aksi primer, harga, badge sukses)
  accent: '#1B7A3E',
  accentSoft: 'rgba(27,122,62,0.10)',

  // biru iOS: navigasi, link, tab aktif
  blue: '#007AFF',
  blueSoft: 'rgba(0,122,255,0.10)',

  // "bubble out" hijau muda - dipakai untuk aksi sukses
  green: '#1B7A3E',
  greenSoft: '#EAF6EE',

  danger: '#FF3B30',
  dangerSoft: 'rgba(255,59,48,0.12)',

  warning: '#FF9F0A',
  warningSoft: '#FFF4E0',

  star: '#FF9F0A',

  // netral iOS
  bg: '#F2F2F7',
  surface: '#ffffff',
  surfaceAlt: '#F2F2F7',
  grouped: '#E9E9EE',
  border: '#E5E5EA',
  hairline: 'rgba(0,0,0,0.08)',
  separator: '#C7C7CC',
  text: '#111111',
  textMuted: '#6e6e73',
  textDim: '#8e8e93',
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
  xs: 8,      // badge kecil
  sm: 10,     // input, tombol kecil
  md: 12,     // thumbnail
  lg: 14,     // kartu iOS
  xl: 16,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  gutter: 16, // gutter iOS
} as const;

/** Ruang aman di atas TabBar (± tinggi tab bar iOS) supaya konten tak ketiban. */
export const TABBAR_SPACE = 84;

export const type = {
  // Judul layar iOS (large title): 34px rata kiri
  largeTitle: { fontSize: 34, fontFamily: font.bold, letterSpacing: -0.7 },
  h1: { fontSize: 22, fontFamily: font.bold, letterSpacing: -0.4 },
  h2: { fontSize: 19, fontFamily: font.bold, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontFamily: font.semibold },
  body: { fontSize: 15, fontFamily: font.regular },
  bodyStrong: { fontSize: 15, fontFamily: font.semibold },
  small: { fontSize: 13, fontFamily: font.regular },
  tiny: { fontSize: 11.5, fontFamily: font.medium },
  caption: { fontSize: 12, fontFamily: font.regular },
  button: { fontSize: 16, fontFamily: font.bold },
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
