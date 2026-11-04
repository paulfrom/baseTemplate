#!/usr/bin/env node
/**
 * baseTemplate 静态文件服务器（零依赖）。
 *
 * 由 deploy/deploy.sh 启动，监听 127.0.0.1:8091（可用 HOST / PORT 覆盖），
 * 由 nginx 反向代理对外提供服务。hash 路由不需要 history fallback，
 * 但为兼容直接访问子路径，未命中的请求统一回落到 index.html。
 *
 * 环境变量：
 *   HOST  监听地址，默认 127.0.0.1（仅本机，交给 nginx 反代）
 *   PORT  监听端口，默认 8091
 *   ROOT  静态根目录，默认 <repo>/dist
 */

import { createReadStream, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const HOST = process.env.HOST || "127.0.0.1"
const PORT = Number(process.env.PORT || 8091)
const REPO_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)))
const ROOT = resolve(process.env.ROOT || join(REPO_ROOT, "dist"))

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
}

if (!existsSync(join(ROOT, "index.html"))) {
  console.error(`[serve] 未找到构建产物：${ROOT}/index.html`)
  console.error("[serve] 请先执行 npm run build，或直接使用 deploy/deploy.sh up")
  process.exit(1)
}

/** 带哈希指纹的 assets 长缓存（Vite 产物形如 index-B0WCFHR3.js），其余文件短缓存。 */
function cacheControlFor(pathname) {
  if (pathname.startsWith("/assets/") && /[-.][0-9A-Za-z_-]{8,}\.(js|css|woff2?|png|jpe?g|svg|webp)$/.test(pathname)) {
    return "public, max-age=31536000, immutable"
  }
  if (pathname.endsWith(".html")) return "no-cache"
  return "public, max-age=3600"
}

function sendFile(res, filePath, statusCode, cacheControl) {
  const type = MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream"
  res.writeHead(statusCode, {
    "Content-Type": type,
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
    // 静态资源已由 nginx 提供 gzip 之外的安全头，这里补齐基础项
    "Referrer-Policy": "strict-origin-when-cross-origin",
  })
  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Bad Request")
    return
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`)

  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
    res.end(JSON.stringify({ status: "ok", root: ROOT }))
    return
  }

  // 只允许 GET/HEAD，避免静态服务器被当作写入入口
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end("Method Not Allowed")
    return
  }

  const decoded = decodeURIComponent(pathname)
  const candidate = resolve(join(ROOT, normalize(decoded)))

  // 防目录穿越：解析后的路径必须仍在 ROOT 内
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) {
    res.writeHead(403).end("Forbidden")
    return
  }

  let filePath = candidate
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    filePath = join(candidate, "index.html")
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    // 未命中静态文件时回落到 index.html（hash 路由下通常不会发生）
    filePath = join(ROOT, "index.html")
  }

  const relPath = "/" + filePath.slice(ROOT.length + 1)
  if (req.method === "HEAD") {
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": cacheControlFor(relPath),
    }).end()
    return
  }
  sendFile(res, filePath, 200, cacheControlFor(relPath))
})

server.listen(PORT, HOST, () => {
  console.log(`[serve] baseTemplate 已启动：http://${HOST}:${PORT}`)
  console.log(`[serve] 静态根目录：${ROOT}`)
  console.log(`[serve] 健康检查：http://${HOST}:${PORT}/healthz`)
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`[serve] 收到 ${signal}，正在关闭…`)
    server.close(() => process.exit(0))
    // 兜底：连接迟迟不释放时强制退出
    setTimeout(() => process.exit(0), 3000).unref()
  })
}
