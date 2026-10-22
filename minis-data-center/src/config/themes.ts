/**
 * 主题风格：潮流色板 + 运行时变量派生
 *
 * 只暴露「背景色」「文字色」「动态背景」几个维度给用户，
 * 其余（卡片、边框、次级文字、Arco 变量）按对比度自动派生，
 * 保证任何一组搭配都能形成可用界面。
 */

export type MotionId =
  | 'none'
  | 'aurora'
  | 'ripple'
  | 'nebula'
  | 'mesh'
  | 'scan'
  | 'breathe'

export interface MotionPreset {
  id: MotionId
  name: string
  tip: string
}

/** 动态背景预设：全部为纯 CSS 动画，不依赖外部图片 */
export const MOTION_PRESETS: MotionPreset[] = [
  { id: 'none', name: '无', tip: '纯色' },
  { id: 'aurora', name: '极光', tip: '唯美' },
  { id: 'ripple', name: '波纹', tip: '涟漪' },
  { id: 'nebula', name: '星云', tip: '旋涡' },
  { id: 'mesh', name: '流体', tip: '炫彩' },
  { id: 'scan', name: '赛博', tip: '扫描' },
  { id: 'breathe', name: '呼吸', tip: '微光' },
]

export function isMotionId(value: unknown): value is MotionId {
  return MOTION_PRESETS.some(item => item.id === value)
}

export interface ThemeConfig {
  bg: string
  text: string
  accent: string
  /** 动态背景：默认无，叠加在背景色之上 */
  motion: MotionId
}

export interface Swatch {
  id: string
  name: string
  color: string
  tone: 'dark' | 'light'
  /** 色块展示用的潮流渐变（不影响实际应用色） */
  swatch: string
  tip?: string
}

export const BG_SWATCHES: Swatch[] = [
  {
    id: 'midnight',
    name: '午夜蓝',
    color: '#0B1B2E',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #0B1B2E 0%, #16406B 52%, #3D8BD0 100%)',
    tip: '默认',
  },
  {
    id: 'aurora',
    name: '极光紫',
    color: '#120B2B',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #120B2B 0%, #4B2FD6 48%, #00E0FF 100%)',
    tip: '极光',
  },
  {
    id: 'nebula',
    name: '星云',
    color: '#1A0F33',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #1A0F33 0%, #7B2FF7 52%, #F107A3 100%)',
  },
  {
    id: 'cyber',
    name: '赛博',
    color: '#07070D',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #07070D 0%, #FF2E88 50%, #00E5FF 100%)',
  },
  {
    id: 'deepsea',
    name: '深海',
    color: '#041E28',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #041E28 0%, #0E7C86 52%, #7CF5D4 100%)',
  },
  {
    id: 'graphite',
    name: '石墨',
    color: '#15171C',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #15171C 0%, #3A3F4A 58%, #A6AFBF 100%)',
  },
  {
    id: 'cocoa',
    name: '可可',
    color: '#1C1510',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #1C1510 0%, #5A3B24 55%, #E6B980 100%)',
  },
  {
    id: 'powder',
    name: '粉蓝',
    color: '#DCE9FF',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #A9CBFF 0%, #CFE0FF 46%, #FFD6EC 100%)',
    tip: '粉蓝',
  },
  {
    id: 'sakura',
    name: '樱花',
    color: '#FDE9F1',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #FFB9D5 0%, #FFE3EF 52%, #FFD9C9 100%)',
  },
  {
    id: 'mint',
    name: '薄荷',
    color: '#E3F7EE',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #9EEBD0 0%, #DDF8EE 52%, #CFF0FF 100%)',
  },
  {
    id: 'cream',
    name: '奶油',
    color: '#FAF4E8',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #F6D9A8 0%, #FBF1DE 52%, #FFF9F0 100%)',
  },
  {
    id: 'lilac',
    name: '丁香',
    color: '#EFE9FF',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #C9B8FF 0%, #EDE7FF 52%, #FFD9F2 100%)',
  },
  {
    id: 'void',
    name: '虚空',
    color: '#050810',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #050810 0%, #1B2A4A 58%, #6E8CB8 100%)',
  },
  {
    id: 'twilight',
    name: '暮光',
    color: '#101A3A',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #101A3A 0%, #3B5BD9 50%, #FF8FC7 100%)',
  },
  {
    id: 'forest',
    name: '森林',
    color: '#0C1F18',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #0C1F18 0%, #1E7A5A 55%, #A8F0C6 100%)',
  },
  {
    id: 'wine',
    name: '酒红',
    color: '#1E0E16',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #1E0E16 0%, #7B1E3E 52%, #FF9BB0 100%)',
  },
  {
    id: 'ember',
    name: '余烬',
    color: '#1F1209',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #1F1209 0%, #A34A16 52%, #FFC46B 100%)',
  },
  {
    id: 'steel',
    name: '钢蓝',
    color: '#131B22',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #131B22 0%, #2E4C63 55%, #9FC6DE 100%)',
  },
  {
    id: 'indigo',
    name: '靛夜',
    color: '#14102B',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #14102B 0%, #4A3AC9 52%, #9B8CFF 100%)',
  },
  {
    id: 'moss',
    name: '苔藓',
    color: '#17201A',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #17201A 0%, #3F5E36 55%, #C4DBA0 100%)',
  },
  {
    id: 'roseNight',
    name: '夜玫瑰',
    color: '#1F1020',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #1F1020 0%, #8B2E6B 52%, #FFB8D9 100%)',
  },
  {
    id: 'abyss',
    name: '深渊',
    color: '#050D14',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #050D14 0%, #0E3A56 52%, #35C9E0 100%)',
  },
  {
    id: 'lava',
    name: '熔岩',
    color: '#1A0F0C',
    tone: 'dark',
    swatch: 'linear-gradient(140deg, #1A0F0C 0%, #C2261B 50%, #FFB43D 100%)',
  },
  {
    id: 'peach',
    name: '蜜桃',
    color: '#FFEDE3',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #FFB98F 0%, #FFE0CF 52%, #FFD6E8 100%)',
  },
  {
    id: 'sky',
    name: '天空',
    color: '#E4F1FF',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #8EC8FF 0%, #D4EBFF 52%, #E8FCFF 100%)',
  },
  {
    id: 'lemon',
    name: '柠檬',
    color: '#FBF7DA',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #F2E27A 0%, #FBF6D0 52%, #E7F7C4 100%)',
  },
  {
    id: 'sand',
    name: '沙丘',
    color: '#F3EADB',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #D9BC96 0%, #F1E4CE 52%, #FBF5EA 100%)',
  },
  {
    id: 'fog',
    name: '雾灰',
    color: '#ECEFF3',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #B9C3D0 0%, #E4E9F0 52%, #F7F9FC 100%)',
  },
  {
    id: 'aqua',
    name: '水光',
    color: '#DFF4F8',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #7ADBE8 0%, #D6F3F7 52%, #E6FBFF 100%)',
  },
  {
    id: 'blush',
    name: '胭脂',
    color: '#FCE7E3',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #F2A79B 0%, #FBDDD7 52%, #FDEFF0 100%)',
  },
  {
    id: 'grape',
    name: '葡萄',
    color: '#EFE3FA',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #B98BE8 0%, #E9DAF8 52%, #F6EAFB 100%)',
  },
  {
    id: 'pistachio',
    name: '开心果',
    color: '#EAF3DE',
    tone: 'light',
    swatch: 'linear-gradient(140deg, #B5D98A 0%, #E6F2D4 52%, #F4F9E8 100%)',
  },
]

export const TEXT_SWATCHES: Array<{ id: string; name: string; color: string }> = [
  { id: 'snow', name: '冷白', color: '#E8F2FC' },
  { id: 'pure', name: '纯白', color: '#FFFFFF' },
  { id: 'ice', name: '冰蓝', color: '#CFE8FF' },
  { id: 'lavender', name: '淡紫', color: '#E7DEFF' },
  { id: 'mint', name: '薄荷', color: '#D6FFF0' },
  { id: 'peach', name: '蜜桃', color: '#FFE6D6' },
  { id: 'rose', name: '玫瑰', color: '#FFD3E0' },
  { id: 'neon', name: '荧光', color: '#9BF6FF' },
  { id: 'ink', name: '墨黑', color: '#16293F' },
  { id: 'charcoal', name: '炭灰', color: '#2B3038' },
  { id: 'navy', name: '藏青', color: '#1B2A4A' },
  { id: 'plum', name: '梅紫', color: '#3B2340' },
  { id: 'forestTxt', name: '墨绿', color: '#1E3A2F' },
  { id: 'coffee', name: '咖啡', color: '#3A2A1E' },
  { id: 'wineTxt', name: '酒红', color: '#3D1F24' },
  { id: 'steelTxt', name: '钢青', color: '#223540' },
  { id: 'cream', name: '奶油', color: '#FFF3DC' },
  { id: 'lemonTxt', name: '柠黄', color: '#F4FFC2' },
  { id: 'mist', name: '雾紫', color: '#D8D4F5' },
  { id: 'silver', name: '银灰', color: '#C7D2DE' },
]

export const DEFAULT_THEME: ThemeConfig = {
  bg: '#0B1B2E',
  text: '#E8F2FC',
  accent: '#4C9DE4',
  motion: 'none',
}

/* ── 颜色计算 ─────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const int = Number.parseInt(h, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

/** 把 a 往 b 混合，ratio 为 b 的占比 */
export function mix(a: string, b: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio,
  )
}

function channelLum(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b)
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

export function isDarkBg(bg: string): boolean {
  return luminance(bg) < 0.38
}

/** 主色在深/浅底上的可读版本 */
function readableAccent(accent: string, dark: boolean): string {
  const c = contrastRatio(accent, dark ? '#0B1B2E' : '#FFFFFF')
  if (c >= 2.2) return accent
  return dark ? mix(accent, '#FFFFFF', 0.3) : mix(accent, '#000000', 0.15)
}

/**
 * 由「背景 + 文字」派生整套 CSS 变量。
 * 输出同时覆盖 --mc-* 与 Arco --color-*，便于全局一键换肤。
 */
export function buildThemeVars(theme: ThemeConfig): Record<string, string> {
  const dark = isDarkBg(theme.bg)
  const { bg, text } = theme
  const accent = readableAccent(theme.accent || DEFAULT_THEME.accent, dark)

  const card = mix(bg, text, dark ? 0.07 : 0.05)
  const card2 = mix(bg, text, dark ? 0.115 : 0.085)
  const elevated = mix(bg, text, dark ? 0.095 : 0.07)
  const sunken = mix(bg, '#000000', dark ? 0.3 : 0.05)
  const deep = mix(bg, '#000000', dark ? 0.45 : 0.08)

  const secondary = mix(text, bg, 0.26)
  const tertiary = mix(text, bg, 0.48)
  const disabled = mix(text, bg, 0.66)

  const border = mix(bg, text, dark ? 0.16 : 0.13)
  const borderStrong = mix(bg, text, dark ? 0.26 : 0.2)
  const fill1 = mix(bg, text, 0.05)
  const fill2 = mix(bg, text, 0.08)
  const fill3 = mix(bg, text, 0.12)
  const fill4 = mix(bg, text, 0.18)

  const hover = mix(bg, text, dark ? 0.09 : 0.07)
  const active = mix(bg, text, dark ? 0.15 : 0.12)

  // 背景氛围光：随主题色微调，保持很低的强度，避免“反光”感
  const glowA = mix(bg, accent, dark ? 0.35 : 0.25)
  const glowB = mix(bg, accent, dark ? 0.24 : 0.18)
  const glowC = mix(bg, accent, dark ? 0.5 : 0.34)

  // 动态背景的两种基色：比氛围光鲜明，但仍贴近主色
  const motion1 = mix(bg, accent, dark ? 0.68 : 0.42)
  const motion2 = mix(mix(bg, accent, dark ? 0.9 : 0.6), text, 0.3)

  return {
    '--mc-motion-1': motion1,
    '--mc-motion-2': motion2,

    '--mc-aurora-a': `color-mix(in srgb, ${glowA} ${dark ? 5 : 9}%, transparent)`,
    '--mc-aurora-b': `color-mix(in srgb, ${glowB} ${dark ? 4 : 7}%, transparent)`,
    '--mc-aurora-c': `color-mix(in srgb, ${glowC} ${dark ? 7 : 12}%, transparent)`,

    '--mc-bg-page': bg,
    '--mc-bg-sunken': sunken,
    '--mc-bg-card': card,
    '--mc-bg-card-2': card2,
    '--mc-bg-elevated': elevated,
    '--mc-bg-hover': hover,
    '--mc-bg-active': active,

    '--mc-text-primary': text,
    '--mc-text-secondary': secondary,
    '--mc-text-tertiary': tertiary,
    '--mc-text-disabled': disabled,

    '--mc-border': border,
    '--mc-border-strong': borderStrong,
    '--mc-border-accent': accent,

    '--mc-primary': accent,
    '--mc-primary-hover': mix(accent, '#FFFFFF', dark ? 0.22 : 0.12),
    '--mc-primary-light': `color-mix(in srgb, ${accent} 16%, transparent)`,

    '--color-bg-1': card,
    '--color-bg-2': card2,
    '--color-bg-3': sunken,
    '--color-bg-4': bg,
    '--color-bg-5': deep,
    '--color-bg-white': card,
    '--color-bg-popup': elevated,

    '--color-text-1': text,
    '--color-text-2': secondary,
    '--color-text-3': tertiary,
    '--color-text-4': disabled,

    '--color-border-1': fill1,
    '--color-border-2': fill2,
    '--color-border-3': fill3,
    '--color-border-4': fill4,

    '--color-fill-1': fill1,
    '--color-fill-2': fill2,
    '--color-fill-3': fill3,
    '--color-fill-4': fill4,

    '--color-mask-bg': dark ? 'rgba(0, 0, 0, 0.62)' : 'rgba(12, 20, 32, 0.32)',
    '--color-spin-layer-bg': `color-mix(in srgb, ${bg} 86%, transparent)`,

    '--primary-1': `color-mix(in srgb, ${accent} 16%, transparent)`,
    '--primary-2': `color-mix(in srgb, ${accent} 24%, transparent)`,
    '--primary-3': `color-mix(in srgb, ${accent} 34%, transparent)`,
    '--primary-4': `color-mix(in srgb, ${accent} 48%, transparent)`,
    '--primary-5': `color-mix(in srgb, ${accent} 74%, transparent)`,
    '--primary-6': accent,
    '--primary-7': mix(accent, '#FFFFFF', dark ? 0.24 : 0.12),
    '--arcoblue-1': `color-mix(in srgb, ${accent} 16%, transparent)`,
    '--arcoblue-2': `color-mix(in srgb, ${accent} 24%, transparent)`,
    '--arcoblue-3': `color-mix(in srgb, ${accent} 34%, transparent)`,
    '--arcoblue-4': `color-mix(in srgb, ${accent} 48%, transparent)`,
    '--arcoblue-5': `color-mix(in srgb, ${accent} 74%, transparent)`,
    '--arcoblue-6': accent,
    '--arcoblue-7': mix(accent, '#FFFFFF', dark ? 0.24 : 0.12),
  }
}

/** 把变量写到 html / body，内联优先级最高，可覆盖任意样式表 */
export function applyThemeVars(vars: Record<string, string>, dark: boolean) {
  const targets = [document.documentElement, document.body]
  for (const el of targets) {
    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(key, value)
    }
    el.setAttribute('arco-theme', dark ? 'dark' : 'light')
    el.style.colorScheme = dark ? 'dark' : 'light'
  }
}
