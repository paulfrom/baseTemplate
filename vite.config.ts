import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // 部署在子路径时用 VITE_BASE 覆盖，例如 VITE_BASE=/baseTemplate/ npm run build
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  test: {
    maxWorkers: 2,
    alias: [
      { find: /^@ead\/suid$/, replacement: fileURLToPath(new URL('./node_modules/@ead/suid/es/index.js', import.meta.url)) },
      { find: /^@ead\/suid-utils-react$/, replacement: fileURLToPath(new URL('./node_modules/@ead/suid-utils-react/es/index.js', import.meta.url)) },
    ],
    server: { deps: { inline: [/@ead\//] } },
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // 运行环境会把依赖只读挂载到 .node_modules-host，需显式排除其自带的测试文件。
    exclude: ['**/node_modules/**', '**/.node_modules-host/**', '**/dist/**', '**/.dist-host/**'],
    // 演示数据量级扩大后页面渲染测试耗时增加，放宽默认 5000ms 超时
    testTimeout: 30000,
  },
})
