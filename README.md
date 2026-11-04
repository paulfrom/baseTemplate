# baseTemplate

业务原型模板项目：保留完整的应用框架（门户入口、应用外壳、hash 路由、五套主题、图表基建、测试与质量门禁），内置「数据驾驶舱」示例，并参考 SEI Portal 补齐菜单、应用和用户配置基础能力，适合作为新业务原型的起点。

## 快速开始

```bash
npm install     # Node 22/24 LTS（engines: >=22 <26）
npm run dev     # 本地开发，默认 http://127.0.0.1:5173
npm run verify  # typecheck + lint + test + build 完整门禁
```

启动后默认进入门户页（`#/portal`），点击「数据驾驶舱」卡片或侧边菜单进入 `#/analytics-cockpit`。

## 门户基础配置

外壳和用户菜单提供以下入口，页面均为可操作的纯前端原型：

- `#/menu-management`：菜单分组、页面路由、权限标识、显示开关、排序及新增 / 编辑 / 删除；保存后同步侧边栏、顶部导航和面包屑。
- `#/app-management`：应用卡片、分类、路由、标签、门户展示和启停状态；保存后同步门户首屏卡片。
- `#/user-settings`：基本资料、头像颜色、默认主题、首页与密度偏好、通知开关，以及明确标注为演示的安全设置。

菜单、应用和用户偏好共享 `src/app/portal-settings.ts` 中的本地事实源，默认写入浏览器 `localStorage` 的 `prototype_portal_settings_v1`，刷新后保留；可在各管理页点击「恢复默认」还原对应配置。权限标识、登录设备、密码修改和通知渠道仅用于原型演示，不代表真实权限、认证或后端能力。

## 技术栈

React 19 + TypeScript + Vite + Ant Design 6 + ECharts 6 + Vitest/Testing Library。纯前端 Mock 数据，无后端、无登录、无真实权限。

## 目录结构

```
src/
├── App.tsx                    # 入口：主题令牌、门户/外壳分发
├── app/
│   ├── hash-navigation.ts     # AppRoute 联合类型 + hash 路由（单一事实源）
│   ├── portal-settings.ts     # 菜单 / 应用 / 用户偏好本地共享配置
│   ├── route-registry.tsx     # route → lazy 页面组件注册表
│   └── AppShell.tsx           # 应用外壳：动态菜单、用户菜单、面包屑、主题切换
├── components/charts/         # EChart 封装、全国轨迹地图、趋势图 option 构建器
├── modules/
│   ├── portal/                # 门户入口页（应用卡片与用户菜单）
│   ├── analytics-cockpit/     # 示例业务模块：数据驾驶舱（自带 mockData 与测试）
│   ├── menu-management/       # 菜单树与导航配置
│   ├── app-management/        # 应用入口与门户卡片配置
│   └── user-settings/         # 用户资料、主题、通知与安全演示
├── styles/                    # tokens.css（设计令牌）、全局与外壳样式
└── test/setup.ts              # Vitest 环境（jsdom 补丁、antd message 清理）
scripts/serve.mjs              # 零依赖静态服务器（托管 dist/，默认 127.0.0.1:8091）
deploy/                        # 部署：deploy.sh、nginx 配置、systemd unit
install.sh                     # 安装到 /home/paul/project/baseTemplate 并部署
```

## 如何新增一个页面

四个接线点，按顺序改：

1. **路由**：`src/app/hash-navigation.ts` 中给 `AppRoute` 联合类型和 `knownRoutes` 加新路由 id；
2. **渲染**：`src/app/route-registry.tsx` 中加 `lazy(() => import("../modules/<name>"))` 和 `renderMainRoute` 的 switch 分支；
3. **菜单与文案**：`src/app/AppShell.tsx` 中补 `routeLabels` / `systemLabels`（必填），有分组时再补 `routeGroupLabels` / `routeToGroupMap` / `routeToOpenKeys`；默认导航来自 `portal-settings.ts` 的菜单配置，新增页面还需在菜单管理中配置可见入口（或补充默认菜单）。
4. **模块**：新建 `src/modules/<name>/`，包含页面组件、`index.ts` 导出、模块 css 与测试；数据用模块内 mock（参考 `analytics-cockpit/mockData.ts`）。

如需在门户加入口卡片，进入「应用管理」新建应用并开启「门户展示」；如需随模板默认提供入口，在 `src/app/portal-settings.ts` 的 `DEFAULT_APPLICATIONS` 中追加配置。

## 主题

外壳内置五套主题：建筑蓝（light，默认）、山野黑（dark）、云境白（aurora）、星穹夜（obsidian）、玄武岩（slate）。aurora/obsidian/slate 为顶栏布局，slate 支持顶栏/侧栏切换。主题令牌在 `src/styles/tokens.css`（CSS 变量）与 `src/App.tsx` 的 `PROTOTYPE_ANTD_THEME_TOKENS`（antd 运行时令牌）两处保持同一口径，新增主题需同时补两处。

## 本机部署

架构：`浏览器 → nginx :8090 → 127.0.0.1:8091 (scripts/serve.mjs) → dist/`。

应用进程只用 `nohup` + pid 文件（`.run/app.pid`）管理，不需要 root。nginx 有两种模式，脚本自动选择：

| 模式 | 触发条件 | 行为 |
| --- | --- | --- |
| `host` | 本机装了 nginx | 写入 `/etc/nginx`（Debian 走 sites-available，其余走 conf.d）并用 sudo reload |
| `docker` | 本机没有 nginx、但有可用 docker | 起一个专用容器 `baseTemplate-nginx`（`--network host`，`--restart unless-stopped`），把渲染后的配置挂到 `/etc/nginx/conf.d/default.conf` |
| `none` | `--no-nginx` 或 `NGINX_MODE=none` | 只起应用 |

docker 模式用 `--network host`，所以容器里的 nginx 能直接访问宿主机 `127.0.0.1:8091`（应用只绑本机回环，不对外暴露）。换端口/换容器名用 `NGINX_PORT` / `NGINX_CONTAINER` / `NGINX_IMAGE` 覆盖；强制指定模式用 `NGINX_MODE=host|docker|none`。

```bash
# 1) 首次安装（放置到目标目录 + 装依赖 + 构建 + 启动 + nginx）
./install.sh

# 若从分发包开始（还没有 /home/paul/project/baseTemplate）：
#   mkdir -p /home/paul/project
#   tar -xzf baseTemplate.tar.gz -C /home/paul/project
#   cd /home/paul/project/baseTemplate && ./install.sh

# 2) 日常迭代（依赖已装好，只做 build + 重启，秒级完成）
cd /home/paul/project/baseTemplate
deploy/deploy.sh up         # 构建 → 重启应用 → reload nginx
deploy/deploy.sh restart    # 同 up（先停后起）
deploy/deploy.sh status     # 应用 / 健康检查 / nginx 状态
deploy/deploy.sh logs       # 跟踪 .run/app.log
deploy/deploy.sh down       # 停止应用
deploy/deploy.sh nginx-stop # 移除本项目的 nginx（容器或本机站点）
deploy/deploy.sh doctor     # 环境自检：node / docker / nginx / 端口 / 防火墙 / 日志
deploy/deploy.sh firewall-open  # 放行对外端口（firewalld / ufw）
```

关于端口：**8091 是应用内部端口，只绑定 127.0.0.1；对外访问一律用 8090**。8090 打不开说明 nginx 没起来——`up` 会以非 0 退出并提示，再跑 `deploy/deploy.sh doctor` 看 docker/nginx 状态。

依赖安装策略：`node_modules` 存在且不比 `package-lock.json` 旧时**跳过安装**，只有首次部署、依赖缺失或 lockfile 更新时才自动 `npm ci`。需要强制重装用 `--install`（`install.sh --install` / `deploy/deploy.sh up --install`）。

nginx 容器不会每次部署都重建：渲染配置与上次一致时只执行 `nginx -s reload`；端口/域名变化才重建容器。

`install.sh` 支持 `TARGET_DIR=/your/path ./install.sh` 改安装路径；`deploy.sh` 支持 `--no-nginx`（只起应用）、`--skip-install`、`--skip-build`。

可覆盖的环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8091` | 应用监听端口（仅绑定 `127.0.0.1`） |
| `NGINX_PORT` | `8090` | nginx 对外端口；改 `80` 前先确认发行版默认站点是否占用 `default_server` |
| `SERVER_NAME` | `_` | nginx `server_name`，绑定域名时填写 |
| `NGINX_MODE` | `auto` | `auto` / `host` / `docker` / `none` |
| `NGINX_CONTAINER` | `baseTemplate-nginx` | docker 模式下的容器名 |
| `NGINX_IMAGE` | `nginx:alpine` | docker 模式使用的镜像 |

改端口示例：`NGINX_PORT=80 SERVER_NAME=baseTemplate.local deploy/deploy.sh up`。

**docker 模式说明**：容器只做反向代理，静态文件仍在宿主机的 `dist/` 里，由 8091 上的 `serve.mjs` 提供，所以改前端只需 `deploy/deploy.sh restart`，不用重建容器。若 8090 已被你现有的 nginx 容器占用，`up` 会失败并打印容器日志，用 `NGINX_PORT=8091 deploy/deploy.sh nginx` 换端口即可。查看容器：`docker ps --filter name=baseTemplate-nginx`；移除：`deploy/deploy.sh nginx-stop`。

**为什么 nginx 默认用 8090（而不是 80）**：Debian/Ubuntu 装完 nginx 后自带的默认站点会占用 `listen 80 default_server`，直接再用 80 会导致按 IP 访问时落到默认欢迎页。8090 不干扰系统既有站点；确实要 80 时，先禁用默认站点（`sudo rm /etc/nginx/sites-enabled/default` 并 reload）再执行 `NGINX_PORT=80 deploy/deploy.sh up`。

**开机自启（可选）**：`nohup` 进程在机器重启后不会自动拉起。需要长期驻留时安装 systemd 服务：

```bash
mkdir -p .run
sudo install -m 644 deploy/baseTemplate.service /etc/systemd/system/baseTemplate.service
sudo systemctl daemon-reload && sudo systemctl enable --now baseTemplate
# 之后用 sudo systemctl restart baseTemplate 代替 deploy/deploy.sh restart
```

unit 里写死了 `/home/paul/project/baseTemplate` 与 `User=paul`，换路径/用户时同步修改。

**子路径部署（可选）**：要挂在 `http://host/baseTemplate/` 下时，构建加 base，并让 nginx 只代理该前缀：

```bash
VITE_BASE=/baseTemplate/ npm run build
# nginx 侧把 location / 换成 location /baseTemplate/ { proxy_pass http://127.0.0.1:8091/; }
```

## 质量门禁

- `npm run typecheck`：TS 严格模式（含 noUnusedLocals/noUnusedParameters）
- `npm run lint`：oxlint（react rules-of-hooks 为 error）
- `npm test`：Vitest + jsdom；EChart 在测试中按惯例 mock（参考 `App.test.tsx`）
- `npm run build`：产物构建
- CI：`.github/workflows/quality.yml` 在 push/PR 时跑完整门禁
