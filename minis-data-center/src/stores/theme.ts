import { defineStore } from 'pinia'
import {
  DEFAULT_THEME,
  buildThemeVars,
  applyThemeVars,
  isDarkBg,
  isMotionId,
  type MotionId,
  type ThemeConfig,
} from '@/config/themes.ts'
import type { WallpaperConfig } from '@/api/wallpaper.ts'

const STORAGE_PREFIX = 'mc.theme.v1'

/** 壁纸图片以 blob 地址缓存在内存里，切换/清空时释放，避免图片常驻 */
function releaseWallpaperUrl(url?: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/** 每个账号独立一份：mc.theme.v1.u<userId>，未登录用 guest */
function storageKey(userId: number | string | null | undefined) {
  return userId === null || userId === undefined
    ? `${STORAGE_PREFIX}.guest`
    : `${STORAGE_PREFIX}.u${userId}`
}

function readTheme(userId: number | string | null | undefined): ThemeConfig {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { ...DEFAULT_THEME }
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>
    return {
      bg: typeof parsed.bg === 'string' ? parsed.bg : DEFAULT_THEME.bg,
      text: typeof parsed.text === 'string' ? parsed.text : DEFAULT_THEME.text,
      accent: typeof parsed.accent === 'string' ? parsed.accent : DEFAULT_THEME.accent,
      motion: isMotionId(parsed.motion) ? parsed.motion : DEFAULT_THEME.motion,
    }
  } catch {
    return { ...DEFAULT_THEME }
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    bg: DEFAULT_THEME.bg,
    text: DEFAULT_THEME.text,
    accent: DEFAULT_THEME.accent,
    motion: DEFAULT_THEME.motion as MotionId,
    /** 当前账号的图片壁纸，null 表示未设置 */
    wallpaper: null as WallpaperConfig | null,
    wallpaperLoaded: false,
    /** 当前绑定的账号（null = 未登录，使用 guest 主题） */
    userId: null as number | string | null,
    bound: false,
  }),
  getters: {
    isDark: (state) => isDarkBg(state.bg),
    theme: (state): ThemeConfig => ({
      bg: state.bg,
      text: state.text,
      accent: state.accent,
      motion: state.motion,
    }),
    /** 当前主题存储 key，便于调试/排查 */
    storageKey: (state) => storageKey(state.userId),
  },
  actions: {
    /** 登录态变化时调用：加载该账号自己的配色并应用 */
    bindUser(userId: number | string | null | undefined) {
      const nextId = userId ?? null
      if (this.bound && this.userId === nextId) return
      this.userId = nextId
      this.bound = true

      const saved = readTheme(nextId)
      this.bg = saved.bg
      this.text = saved.text
      this.accent = saved.accent
      this.motion = saved.motion
      this.apply()
    },
    apply() {
      applyThemeVars(buildThemeVars(this.theme), isDarkBg(this.bg))
    },
    setBg(color: string) {
      this.bg = color
      this.persist()
      this.apply()
    },
    setText(color: string) {
      this.text = color
      this.persist()
      this.apply()
    },
    setAccent(color: string) {
      this.accent = color
      this.persist()
      this.apply()
    },
    setMotion(motion: MotionId) {
      this.motion = motion
      this.persist()
    },
    /** 登录后回填服务端的壁纸配置 */
    setWallpaper(config: WallpaperConfig | null) {
      releaseWallpaperUrl(this.wallpaper?.url)
      this.wallpaper = config
      this.wallpaperLoaded = true
    },
    /** 本地即时预览（拖动遮罩等），持久化由调用方负责 */
    patchWallpaper(patch: Partial<WallpaperConfig>) {
      if (!this.wallpaper) return
      this.wallpaper = { ...this.wallpaper, ...patch }
    },
    /** 退出登录或切账号时清空内存中的壁纸 */
    clearWallpaper() {
      releaseWallpaperUrl(this.wallpaper?.url)
      this.wallpaper = null
      this.wallpaperLoaded = false
    },
    /** 一键应用一组配色 */
    applyTheme(theme: ThemeConfig) {
      this.bg = theme.bg
      this.text = theme.text
      this.accent = theme.accent
      this.motion = theme.motion
      this.persist()
      this.apply()
    },
    reset() {
      this.bg = DEFAULT_THEME.bg
      this.text = DEFAULT_THEME.text
      this.accent = DEFAULT_THEME.accent
      this.motion = DEFAULT_THEME.motion
      this.persist()
      this.apply()
    },
    persist() {
      try {
        localStorage.setItem(storageKey(this.userId), JSON.stringify(this.theme))
      } catch {
        // 存储不可用时静默降级，不影响当前会话
      }
    },
  },
})
