# 公司模板组件与页面规则

## 目标与当前状态

本仓库供业务人员生成和操作前端原型，数据、保存与流程状态均使用 Mock。生成的业务页面需要与公司开发模板采用相同的真实组件、表单复用方式与页面规则，便于开发人员按同一结构接续实现。

参考目录：`D:/project/ead/templateProject/eadp-mono-repo/frontend`。baseTemplate 使用 React 18 / SUID 2.1.99，UI 和图标统一使用公司包。

**已对齐**（2026-11-05）：

- 目录结构：`config/`（路由表、主题、代理）、`src/pages/`、`src/layouts/`、`src/models/`、`src/services/`、`src/utils/`、`src/plugins/`、`src/locales/`、`src/components/`、`src/assets/`。
- 页面：`Dashboard`、`Login`、`SampleRequest`（列表 / 表单 / 详情三页 + 行操作组件）从目标模板迁入，`SampleRequest` 的 `Form` 与 `Detail` 是独立路由，共用同一主表单。
- 流程示例：`WorkflowExample`（列表 / 共用主表单 / 只读详情 / 审批办理四页）参照目标模板 `src/pages/Project/ProjectApply` 与 `src/components/BpmApprovePageAdapter` 的结构实现，直接使用 SUID 的 `WorkFlow.StartFlow` / `WorkFlow.Approve` / `WorkFlow.EndFlow`，BPM 契约由 `src/mocks/bpm.ts` + `src/mocks/browser.ts` 的 MSW 拦截模拟。

**未对齐**（不得宣称完整工程架构一致）：

- 引擎仍是 Vite + hash 路由，不是 Umi 4 + dva + qiankun。目标模板的 `umi`（`history` / `Link` / `getIntl` / `connect`）与 dva model 分别由 `src/utils/navigation.ts`、`src/components/Link.tsx`、`src/utils/intl.ts`、`src/models/global.ts` 提供等价能力。
- 不做真实登录、真实权限与服务端请求：`services/api.ts` 与页面内 `service.ts` 全部是本地 Mock；`AuthAction` 包裹层已移除（无会话时它不会渲染子节点），权限码保留在 `constants.ts` 供接入真实项目时登记。
- 工作流只迁入了组件用法，没有迁入真实 BPM 服务：`WorkFlow` 组件发出的 `sei-bpm/**` 请求全部由 MSW 拦截，进程内状态存在内存里，刷新页面即回到演示数据；接入真实项目时把 `src/mocks/browser.ts` 的 handler 换成真实网关地址即可。目标仓库 BPM 契约另见 `.agents/skills/suid-recipes/references/workflow-approve.md`。

内部 npm 源已写入本仓库 `.npmrc`，不包含凭据。不得自行实现一个同名 ExtTable 或 WorkFlow 来宣称一致。

## 事实来源

以下路径相对公司模板目录；规则以实际文件为准（其 AGENTS.md 中 `.claude/rules/` 引用已漂移）。

| 内容 | 源码位置 | baseTemplate 对应 |
| --- | --- | --- |
| 技术栈、依赖版本 | `package.json`、`AGENTS.md` | `package.json` |
| 路由定义 | `config/router.config.ts` | `config/router.config.ts` |
| 通用页面规则 | `.claude/business-dev.md` | 本文件 |
| 列表范例 | `src/pages/SampleRequest/index.jsx` | `src/pages/SampleRequest/index.tsx` |
| 共用主表单 | `src/pages/SampleRequest/Form/index.jsx` | `src/pages/SampleRequest/Form/index.tsx` |
| 只读详情 | `src/pages/SampleRequest/Detail/index.jsx` | `src/pages/SampleRequest/Detail/index.tsx` |
| 行操作 | `src/pages/SampleRequest/components/SampleRequestListAction.jsx` | 同名 `.tsx` |
| 服务层 | `src/pages/SampleRequest/service.js` | 同名 `.ts`（本地 Mock） |
| 运行时根容器 | `src/app.tsx`（`rootContainer`） | `src/app.tsx` |
| 流程列表 | `src/pages/Project/ProjectApply/index.jsx` | `src/pages/WorkflowExample/index.tsx` |
| 流程主表单 | `src/pages/Project/ProjectApply/Form/index.jsx` | `src/pages/WorkflowExample/Form/index.tsx` |
| 流程审批薄壳 | `src/pages/Project/ProjectApply/approve/*/index.jsx` | `src/pages/WorkflowExample/Approve/index.tsx` |
| 流程审批适配器 | `src/components/BpmApprovePageAdapter/index.jsx` | `src/components/WorkflowApprovePage/index.tsx` |
| 流程契约 | BPM 服务端接口 | `src/mocks/bpm.ts` + `src/mocks/browser.ts`（MSW 拦截） |

## 组件选择

| 场景 | 必须沿用的组件或模式 | Mock 边界 |
| --- | --- | --- |
| 列表 | SUID `ExtTable` | 无接口，使用 `dataSource`，查询、分页、选择和删除在本地处理 |
| 编辑与查看 | SUID `Form` 及字段组件，同一主表单 | 保存更新模块内 Mock 状态 |
| 下拉、树选择 | `ComboList`、`ComboTree` | 本地选项；配置、reader、onChange 不使用 useMemo/useCallback |
| 金额 | `MoneyInput`、`Money` | 本地字段 |
| 日期范围筛选 | `FilterDate` | 本地筛选 |
| 附件 | `Attachment` | 不访问 EDM；只读保留预览/下载，关闭上传/删除，禁止 disabled={readOnly} |
| 流程 | `WorkFlow.Approve` 与共用主表单 | 已迁入 `WorkflowExample`；BPM 契约由 MSW 拦截，不连接 BPM |

UI 优先使用 SUID 扩展组件，其次使用 SUID 基础组件，再复用已有项目封装。图标使用 `@ead/suid-icons`。不为转发 props 新建薄包装，不复制第二套通用表格、表单或流程组件。用户可见业务文案走 `src/locales` 的 i18n key。

## 列表页面

- 新增等业务动作放 `toolbar.left`，按业务需要启用 quickSearch。
- 操作列固定左侧，位于业务列之前；启用选择时顺序为勾选、操作、业务列。
- 行按钮使用 `Space size={4}`；操作列宽度沿用模板 `getOperationColumnWidth` 的计算方式。
- Mock 数据、字段常量和交互放页面目录内。禁止保留远程 store、网关地址或真实请求作为备用路径。

## 编辑与流程页面

- 一个业务模块只维护一份主表单，普通新增、编辑、查看和流程入口共同使用，避免字段、校验和布局分叉。
- 记录标识来自路由 query（`?id=`），表单页与详情页用 `key` 保证切换记录时重置字段与请求状态。
- 普通页面显示保存和返回；只读详情只显示返回，缺 `id` 时给出明确错误并可重试。

### 流程（WorkFlow / BPM）

- 审批页用 `src/components/WorkflowApprovePage` 适配器：解析 `taskId` / `id` / `instanceId`，缺业务 id 时给出明确提示，再用 `WorkFlow.Approve` 包住业务主表单。业务模块只写薄壳。
- 发起流程用 `WorkFlow.StartFlow`，`beforeStart` 先落库再返回 `businessKey`；终止流程用 `WorkFlow.EndFlow`，行内直接复用。
- **`WorkFlow.StartFlow` 的 children 渲染函数被组件内部 `useMemo` 缓存**，只在流程自身状态变化时重新求值：不要在 children 里依赖表单的加载态等外部状态，否则会永久冻结在首帧。表单数据就绪后再挂载该组件即可。
- BPM 契约（`sei-bpm/**`）统一由 `src/mocks/bpm.ts` 的内存状态机实现，并在 `src/mocks/browser.ts` 注册成 MSW handler；未实现的 BPM 接口由兜底 handler 直接失败，不允许穿透到真实服务。
- 流程状态是流程服务的属性，不是业务字段：`src/pages/*/service.ts` 用 `getFlowSummary(businessId)` 合并出状态，避免同一状态两处维护。
- `WorkFlow.Approve` 的「流程图」页签渲染 iframe，默认指向 `public/bpm-flow-chart.html` 静态占位页；接入真实项目时换成 BPM 平台的流程图地址。

## 接入与验收顺序

1. 配置可用的内部 npm 源，核实 SUID 的实际版本、React 兼容性、类型与离线 API；不提交凭据。
2. 对照公司模板配置完成组件运行基础，依据实际依赖决定必须同步的工程设置；宿主认证、真实权限与服务端能力不进入原型。
3. 用一套 Mock 业务记录贯通列表、新增、编辑、查看，先验证真实组件再推广生成规则。
4. 替换被覆盖的旧实现，不保留兼容层；继续复用现有门户、主题和部署成果中适用的部分。
5. 执行 `npm run verify`，并浏览器验证查询、分页、保存与只读交互；未执行的验证不得标为通过。

新增页面只改 `config/router.config.ts` 一处（路径 + 组件 + 可选菜单），不要再引入第二套路由接线方式；调整工程时同步修改 README 与 AGENTS。

## 样式参考与约束

颜色与布局参考 `D:/资料合计/司库/sei-base-demo/sei-base-demo/frontend` 的开发态布局实现；生产态布局仅返回 Outlet，不作为完整宿主外观的证据。组件组合仍遵循上述公司模板规则。

视觉规范依据 `D:/资料合计/司库/htmlTmpelate/HTML约束.md`：默认品牌色 #1677ff，深色侧栏 #001529、白色顶栏、灰色页面背景，统一使用设计令牌。侧栏展开 220px、收起 64px，顶栏 56px，内容间距 24px；参考实现中不符合 4px 步进的间距按规范调整。控件默认高度 32px，正文 14px / 22px，基础圆角 6px。规范与参考冲突时，以规范为准。
