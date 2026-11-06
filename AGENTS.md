# AGENTS.md

## 核心边界

- 默认使用中文沟通；代码标识使用英文，必要注释使用中文。
- 本仓库（baseTemplate）是业务原型模板，只使用 Mock 数据，不实现后端、数据库、真实接口、登录或真实权限控制。
- 本机部署统一走 `deploy/deploy.sh`（应用 127.0.0.1:9090 + nginx 反代），不要另起第二套部署方式。
- 只修改当前请求直接涉及的内容，不顺手重构、不添加未要求功能、不删除无关内容。
- 先验证再宣称；明确区分“原型已验证”和“生产能力未实现”。

## 架构约定

- 公司开发模板基准为 `D:/project/ead/templateProject/eadp-mono-repo/frontend`；生成业务项目须遵循 [组件与页面规则](docs/company-template-alignment.md)，列表、编辑、详情参考 `src/pages/SampleRequest/` 的真实 SUID 组件组合。目录已按模板组织，但引擎仍是 Vite/hash 外壳、未使用 Umi/dva/qiankun，不得宣称完整工程架构已一致。
- 列表、编辑、详情页面必须使用公司模板的真实组件与组合规则，不得用同名自制组件代替。列表使用 `ExtTable` + Mock `dataSource`，编辑与只读详情复用同一主表单。
- 对齐后的业务 UI 从 `@ead/suid` 导入，图标从 `@ead/suid-icons` 导入；不新增直接引用 `antd` 的业务页面，也不要在页面里用 `@ead/antd-style` 的 `createStyles`（该包在 jsdom 与当前依赖下会导致测试进程崩溃），页面样式用 CSS 变量写页面级 css。内部包不可用时明确报告阻断，不创建兼容层或替代实现。
- 原型数据与操作均在前端模拟，不复制宿主登录、权限校验或真实 BPM 服务依赖。登录页只是形式演示（任意账号可登录）；接入真实 WorkFlow 的服务契约须走 `src/mocks/browser.ts` 的 MSW 拦截，禁止请求穿透真实 BPM。

- `config/router.config.ts` 的 `ROUTER_CONFIG` 是路由与菜单的单一事实源；新增页面只改这一处（详见 README「如何新增一个页面」）。
- 页面一律放 `src/pages/<Name>/`，由路由表 `lazy` 加载；页面数据用页面目录内 `service.ts` 的本地 Mock，不引入全局状态库。
- 设计令牌以 `src/styles/tokens.css` 为准；antd 运行时令牌在 `config/theme.config.ts` 同步维护，不在组件里散落主题分支。
- 共享组件放 `src/components/`，避免各页面重复发明按钮、表格、状态和反馈样式。

## 验证与收手

- 日常改动使用最小相关验证；交付前执行 `npm run verify`（typecheck + lint + test + build）。
- 测试环境为 jsdom：页面级测试用 `@ead/suid` 的 `App` 包裹（`App.useApp()` 依赖其上下文），路由级冒烟参考 `src/app.test.tsx`。
- 不得把未执行的浏览器验证表述为已验证。
- 当用户目标已满足、相关验证通过且未引入新的阻断问题时立即结束任务。
