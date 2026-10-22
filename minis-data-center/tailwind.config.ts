import type { Config } from 'tailwindcss'

export default {
  // 只扫描 src 目录下的 Vue/TS 文件，避免扫描 node_modules 导致 HMR 变慢
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
  ],
  // 关闭 preflight（base reset），避免与 Arco Design 的全局样式冲突
  corePlugins: {
    preflight: false,
  },
} satisfies Config
