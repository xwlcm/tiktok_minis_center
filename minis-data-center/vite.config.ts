import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import fs from 'fs'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { compression } from 'vite-plugin-compression2'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  // 构建时统一时间戳，同时写入 HTML meta 和 version.json
  const BUILD_TIME = new Date().toISOString()

  return {
    plugins: [
      vue(),
      tailwindcss(),
      AutoImport({
        resolvers: [ArcoResolver()],
      }),
      Components({
        resolvers: [
          ArcoResolver({
            sideEffect: true,
            resolveIcons: true,
          }),
        ],
      }),
      // Gzip 压缩 — nginx 可直接使用预压缩文件
      compression({
        algorithm: 'gzip',
        threshold: 10240,
      }),
      // Brotli 压缩 — 压缩率更高，现代浏览器均支持
      compression({
        algorithm: 'brotliCompress',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 10240,
      }),
      // 版本检测 — 构建时将时间戳注入 HTML meta 标签，客户端首次加载即可获取
      {
        name: 'version-inject',
        transformIndexHtml(html) {
          return html.replace(
            '<meta name="viewport"',
            `<meta name="app-version" content="${BUILD_TIME}">\n    <meta name="viewport"`,
          )
        },
        closeBundle() {
          const distDir = resolve(__dirname, 'dist')
          if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true })
          }
          fs.writeFileSync(
            resolve(distDir, 'version.json'),
            JSON.stringify({ version: BUILD_TIME, buildTime: BUILD_TIME }),
          )
        },
      },
    ],
    optimizeDeps: {
      include: ['xlsx'],
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5174,
      // 开发模式抑制 info 级日志（pre-bundling 等），warn+error 仍可见
      ...(mode === 'development' && { logLevel: 'warn' }),
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      // 目标现代浏览器 — 生成更紧凑的代码（省去 ES5 polyfill）
      target: 'es2020',
      cssCodeSplit: true,
      minify: 'esbuild',
      chunkSizeWarningLimit: 500,
      // 移除 console.log 和 debugger（生产环境）
      ...(mode === 'production' && {
        esbuild: {
          drop: ['console', 'debugger'],
        },
      }),
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vue 核心 — 几乎所有页面都需要，长期缓存
            if (id.includes('node_modules/vue/') ||
                id.includes('node_modules/@vue/') ||
                id.includes('node_modules/vue-router/') ||
                id.includes('node_modules/pinia/')) {
              return 'vue-vendor'
            }
            // Arco 高频组件 — 大多数页面都用到，合并为一个共享 chunk
            if (id.includes('node_modules/@arco-design/')) {
              const commonComponents = [
                '/table/', '/form/', '/button/', '/input/', '/select/',
                '/modal/', '/message/', '/notification/', '/space/',
                '/grid/', '/layout/', '/menu/', '/pagination/',
                '/tag/', '/switch/', '/spin/', '/tooltip/',
                '/dropdown/', '/popconfirm/', '/icon/',
                '/_components/', '/_utils/', '/_hooks/',
              ]
              if (commonComponents.some(c => id.toLowerCase().includes(c))) {
                return 'arco-common'
              }
              // 低频组件跟随路由自然分割
              return undefined
            }
            // ECharts — 仅图表页面加载
            if (id.includes('node_modules/echarts/') ||
                id.includes('node_modules/zrender/')) {
              return 'echarts'
            }
            // 视频播放器 — 仅播放视频时加载
            if (id.includes('node_modules/@byteplus/veplayer')) {
              return 'veplayer'
            }
            // 上传 SDK — 仅上传页面加载
            if (id.includes('node_modules/@byteplus/uploader') ||
                id.includes('node_modules/tt-uploader')) {
              return 'uploader'
            }
            // axios 单独缓存
            if (id.includes('node_modules/axios/')) {
              return 'axios'
            }
          },
        },
      },
    },
  }
})
