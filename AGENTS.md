# AGENTS.md

## 核心边界

- 默认使用中文沟通；代码标识使用英文，必要注释使用中文。
- 本仓库（baseTemplate）是业务原型模板，只使用 Mock 数据，不实现后端、数据库、真实接口、登录或真实权限控制。
- 本机部署统一走 `deploy/deploy.sh`（应用 127.0.0.1:9090 + nginx 反代），不要另起第二套部署方式。
- 只修改当前请求直接涉及的内容，不顺手重构、不添加未要求功能、不删除无关内容。
- 先验证再宣称；明确区分“原型已验证”和“生产能力未实现”。

## 架构约定

- `src/app/hash-navigation.ts` 的 `AppRoute` 是路由单一事实源；新增页面按 README「如何新增一个页面」的四个接线点顺序修改。
- 页面一律放 `src/modules/<name>/`，通过 `route-registry.tsx` lazy 加载；模块数据用模块内 mock，不引入全局状态库。
- 设计令牌以 `src/styles/tokens.css` 为准；antd 运行时令牌在 `src/App.tsx` 同步维护，不在组件里散落主题分支。
- 共享组件放 `src/components/`，避免各页面重复发明按钮、表格、状态和反馈样式。

## 验证与收手

- 日常改动使用最小相关验证；交付前执行 `npm run verify`（typecheck + lint + test + build）。
- 测试环境为 jsdom：涉及 EChart 的测试按仓库惯例 mock `components/charts/EChart`。
- 不得把未执行的浏览器验证表述为已验证。
- 当用户目标已满足、相关验证通过且未引入新的阻断问题时立即结束任务。
