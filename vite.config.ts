import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.FIXGUILD_API_TARGET || 'http://localhost:8090'
  const proxy: Record<string, ProxyOptions> = {}

  for (const path of ['^/(?:account|platform|tenant)/api(?:/|$)', '^/api/health$', '^/doc\\.html$', '^/swagger-ui', '^/v3/api-docs']) {
    proxy[path] = { target, changeOrigin: true }
  }

  return { plugins: [vue()], server: { proxy }, preview: { proxy } }
})
