# baseTemplate

> 公司模板对齐要求：业务 UI 使用真实 SUID 组件，数据与操作全部 Mock。目录已按公司模板 `eadp-mono-repo/frontend` 组织（`config/` + `src/pages`、`layouts`、`models`、`services`、`utils`、`plugins`、`locales`），`#/sample-request` 是迁入的 ExtTable 列表 + 共用主表单 + 只读详情，`#/workflow-example` 参照 `ProjectApply` 实现流程示例；引擎仍是 Vite / hash 路由，不是 Umi / dva / qiankun。详见 [组件与页面规则](docs/company-template-alignment.md)。

业务原型模板项目：保留完整的应用框架（门户入口、应用外壳、hash 路由、五套主题、测试与质量门禁），内置从公司模板迁入的「申请单示例」「工作台」「登录示例」三个页面，以及参照公司模板 `ProjectApply` 实现的基础「流程示例」，并保留门户与菜单管理基础能力，适合作为新业务原型的起点。

## 快速开始

```bash
npm install     # Node 22/24 LTS（engines: >=22 <26）
npm run dev     # 本地开发，默认 http://127.0.0.1:5173
npm run verify  # typecheck + lint + test + build 完整门禁
```

启动后默认进入门户页（`#/portal`），点击「申请单示例」或「流程示例」卡片进入对应模块；左侧菜单可进入工作台（`#/dashboard`）与菜单管理（`#/menu-management`），登录示例在 `#/user/login`。

### 用 pnpm 时注意 store 目录

pnpm 11 把自身配置放在 `pnpm-workspace.yaml`（`.npmrc` 只放 registry / 认证）。其中 `storeDir` 必须和 `node_modules/.modules.yaml` 里记录的一致，否则 pnpm 认为 `node_modules` 不可用，会先删掉再重装：交互终端里变成确认提示，非交互终端直接报 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`，`pnpm run` 一律失败。跨盘符时 pnpm 默认会把 store 退回到项目内的 `.pnpm-store`，所以本仓库显式写死 `storeDir: D:\.pnpm-store`；换机器或换 store 位置时改这一行（或删掉让 pnpm 用默认值）后再执行 `pnpm install`。

## 页面

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `#/portal` | 门户入口 | 应用卡片首页，卡片来自门户配置 |
| `#/dashboard` | 工作台 | 迁自公司模板，登录前后展示不同欢迎语 |
| `#/sample-request` | 申请单示例 | ExtTable 列表，行操作为查看 / 编辑 / 删除 |
| `#/sample-request/form?id=` | 申请单表单 | 新建与编辑共用主表单 |
| `#/sample-request/detail?id=` | 申请单详情 | 主表单只读模式 |
| `#/workflow-example` | 流程示例 | ExtTable 列表 + 流程状态筛选，行操作按状态显隐 |
| `#/workflow-example/form?id=` | 费用申请单表单 | 新建 / 编辑 / 保存并发起流程，共用主表单 |
| `#/workflow-example/detail?id=` | 费用申请单详情 | 主表单只读模式 |
| `#/workflow-example/approve?id=&taskId=` | 流程审批办理 | `WorkFlow.Approve` 审批面板 + 只读主表单 |
| `#/menu-management` | 菜单管理 | 读取路由表，只允许改导航展示勾选 |
| `#/user/login` | 登录示例 | 迁自公司模板，任意账号可登录，演示验证码与多租户分支 |

### 流程示例怎么用

`#/workflow-example` 是参照公司模板 `src/pages/Project/ProjectApply` 实现的基础流程样例，用真实的 SUID `WorkFlow` 组件演示「发起 → 审批 → 终止」的完整链路：

1. **列表**：四条演示单据分别处于草稿 / 审批中 / 已通过 / 已驳回；行操作按流程状态显隐——草稿可编辑，审批中可办理与终止流程。
2. **发起流程**：打开单据点「保存并发起流程」，确认后由 `WorkFlow.StartFlow` 弹出流程类型与执行人选择，单据随即进入「审批中」。
3. **审批办理**：列表点「审批办理」进入审批页，右侧是 `WorkFlow.Approve` 审批面板（同意 / 不同意 + 审批历史 + 流程日志 + 流程图），左侧是只读主表单；点「同意」逐节点流转到「已通过」。
4. **终止流程**：列表点「终止流程」，`WorkFlow.EndFlow` 要求填写终止原因，单据变为「已终止」。

BPM 服务没有真实实现：`WorkFlow` 发出的 `sei-bpm/**` 请求全部由 `src/mocks/browser.ts` 的 MSW handler 拦截，状态机在 `src/mocks/bpm.ts` 的内存里，刷新页面即回到演示数据。接入真实项目时把 handler 换成真实网关地址即可，页面代码不用改。

## 门户与菜单配置

外壳和用户菜单提供以下入口，页面均为可操作的纯前端原型：

- `#/menu-management`：直接读取 `config/router.config.ts` 的路由清单，支持名称 / 路由 / 分组 / 权限筛选和“导航展示”勾选；取消勾选后同步隐藏侧边栏、顶部导航入口，不提供新增自定义菜单。

菜单与用户偏好共享 `src/models/portal-settings.ts` 中的本地事实源，默认写入浏览器 `localStorage`，刷新后保留；菜单的页面名称、层级、路由和权限始终以路由表为准，仅持久化展示勾选。可在菜单管理页点击「恢复默认」还原。权限标识、通知渠道仅用于原型演示，不代表真实权限、认证或后端能力；登录页的账号密码只做形式校验，不连接任何认证服务。

## 技术栈

React 18 + TypeScript + Vite + SUID 2.1.99 + MSW + Vitest/Testing Library。纯前端 Mock 数据，无后端、无真实登录、无真实权限。内部包安装源见 `.npmrc`。

与公司模板的差异：引擎是 Vite + hash 路由（模板是 Umi 4 + dva + qiankun），因此 `umi` 的 `history` / `Link` / `getIntl` / `connect` 由 `src/utils/navigation.ts`、`src/components/Link.tsx`、`src/utils/intl.ts` 和 `src/models/global.ts` 提供等价能力；页面目录、路由表、布局、模型与服务层的位置与模板一致。

## 目录结构

```
config/
├── router.config.ts           # 路由表：路径、布局、页面组件、菜单元数据（单一事实源）
├── theme.config.ts            # 五套主题的定义与 antd 运行时令牌
└── proxy.config.ts            # 开发代理（原型无后端，留空）
public/
├── app.config.json            # 站点 base / 名称，由 src/utils/constants.ts 读取
└── bpm-flow-chart.html        # 流程示例「流程图」页签的静态占位页
src/
├── app.tsx                    # 根容器：ConfigProvider + App，按路由表选择布局与页面
├── main.tsx                   # Vite 入口（等价于 umi 生成的入口）
├── loading.tsx                # 全局加载态
├── global.css                 # 全局样式入口（对应模板 global.less）
├── assets/                    # 静态资源
├── components/                # 共享组件：Link、PortalIcon、PageStatCards、WorkflowApprovePage
├── layouts/
│   ├── AuthLayout.tsx         # 登录后外壳：动态菜单、面包屑、主题切换
│   ├── LoginLayout.tsx        # 登录页外壳
│   └── BlankLayout.tsx        # 无外壳布局（门户）
├── locales/                   # 国际化词条（zh-CN / en-US）
├── models/
│   ├── global.ts              # 全局模型：语言、当前用户、模拟登录动作
│   └── portal-settings.ts     # 菜单 / 应用 / 用户偏好本地共享配置
├── pages/
│   ├── Dashboard/             # 工作台（迁自公司模板）
│   ├── Login/                 # 登录示例（迁自公司模板）
│   ├── SampleRequest/         # 列表 / Form / Detail / 行操作 / 本地服务
│   ├── WorkflowExample/       # 流程示例：列表 / Form / Detail / Approve / 行操作 / 本地服务
│   ├── Portal/                # 门户入口页
│   └── MenuManagement/        # 菜单树与导航配置（ExtTable + Mock）
├── plugins/onError.tsx        # 运行时错误插件
├── services/api.ts            # 登录等服务（本地 Mock，返回结构与模板一致）
├── mocks/
│   ├── browser.ts             # MSW 浏览器模拟层（拦截 BPM 契约）
│   └── bpm.ts                 # BPM 契约模拟：流程实例 / 任务 / 审批历史状态机
├── utils/                     # navigation / intl / constants / operationColumn
├── styles/                    # tokens.css（设计令牌）、全局与外壳样式
└── test/setup.ts              # Vitest 环境（jsdom 补丁、SUID message 清理）
scripts/serve.mjs              # 零依赖静态服务器（托管 dist/，默认 127.0.0.1:8091）
deploy/                        # 部署：deploy.sh、nginx 配置、systemd unit
install.sh                     # 安装到 /home/paul/project/baseTemplate 并部署
```

## 如何新增一个页面

接线点只有一处：`config/router.config.ts`。

1. **加路由**：在 `ROUTER_CONFIG` 里追加 `{ path, route, layout, component }`，`route` 用 `AppRoute` 联合类型里的新值，`component` 用 `lazy(() => import('../src/pages/<Name>'))`；
2. **进菜单（可选）**：同一条记录里补 `menu`（名称、分组、图标、权限、排序、默认展示），`PORTAL_ROUTE_DEFINITIONS` 会自动派生，菜单管理与外壳读的是同一份；
3. **子页面（可选）**：表单/详情这类页面补 `parentPath`，菜单高亮与面包屑自动归属父列表页；
4. **建页面**：新建 `src/pages/<Name>/index.tsx` 与页面 css、测试；数据用页面目录内 `service.ts` 的本地 Mock。列表、编辑、详情参考 `pages/SampleRequest/` 与 [公司模板对齐规则](docs/company-template-alignment.md)，不得改用普通 Table 或另造一套表单。

如需在门户加入口卡片，在 `src/models/portal-settings.ts` 的 `DEFAULT_APPLICATIONS` 中追加配置并开启 `visibleOnPortal`。

## 主题

外壳内置五套主题：建筑蓝（light，默认）、山野黑（dark）、云境白（aurora）、星穹夜（obsidian）、玄武岩（slate）。aurora/obsidian/slate 为顶栏布局，slate 支持顶栏/侧栏切换。主题令牌在 `src/styles/tokens.css`（CSS 变量）与 `config/theme.config.ts` 的 `PROTOTYPE_ANTD_THEME_TOKENS`（antd 运行时令牌）两处保持同一口径，新增主题需同时补两处。

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
- `npm test`：Vitest + jsdom；页面测试参考 `src/app.test.tsx`（路由级冒烟）与 `src/pages/SampleRequest/sample-request.test.tsx`（列表 + 本地服务）
- `npm run build`：产物构建
- CI：`.github/workflows/quality.yml` 在 push/PR 时跑完整门禁
