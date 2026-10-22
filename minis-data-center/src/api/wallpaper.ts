import request from '@/utils/request.ts'

/** 搜索结果条目，thumb 直接用于预览，original 交给服务端下载 */
export interface WallpaperItem {
  id: string
  thumb: string
  original: string
  width: number
  height: number
  title: string
}

export type WallpaperMotion = 'none' | 'kenburns' | 'float'

/** 当前账号的壁纸配置，图片存在数据库里，url 为前端生成的 blob 地址 */
export interface WallpaperConfig {
  url: string
  sourceUrl?: string
  title?: string
  width?: number
  height?: number
  mask: number
  motion: WallpaperMotion
  updatedAt?: number
}

export function searchWallpaper(keyword: string, page = 0) {
  return request.get<WallpaperItem[]>('/system/wallpaper/search', {
    params: { keyword, page },
  })
}

export function getWallpaper() {
  return request.get<WallpaperConfig | null>('/system/wallpaper/current')
}

/** 一键应用：服务端下载原图并存入数据库，耗时可能超过默认 30s */
export function applyWallpaper(item: WallpaperItem) {
  return request.post<WallpaperConfig>(
    '/system/wallpaper/apply',
    {
      original: item.original,
      title: item.title,
      width: item.width,
      height: item.height,
    },
    { timeout: 120_000 },
  )
}

export function updateWallpaperConfig(mask: number, motion: string) {
  return request.put<WallpaperConfig>('/system/wallpaper/config', null, {
    params: { mask, motion },
  })
}

export function removeWallpaper() {
  return request.delete<void>('/system/wallpaper')
}

/** 读取当前账号的壁纸图片，返回二进制，供页面转成 blob 地址 */
export function getWallpaperImage() {
  return request.get<Blob>('/system/wallpaper/image', {
    responseType: 'blob',
    timeout: 120_000,
  })
}

/** 把图片字节转成可直接给 img 用的 blob 地址 */
export async function loadWallpaperBlob(): Promise<string> {
  const blob = await getWallpaperImage()
  return URL.createObjectURL(blob)
}

/** 拉取当前账号壁纸配置，并附带可直接渲染的图片地址 */
export async function loadWallpaper(): Promise<WallpaperConfig | null> {
  const config = await getWallpaper()
  if (!config) return null
  try {
    config.url = await loadWallpaperBlob()
  } catch {
    // 图片读取失败时保留原地址，背景会回退到纯色
  }
  return config
}
